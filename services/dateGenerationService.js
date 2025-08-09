// Date Generation Service - 複雜日期規則智能生成系統
// Based on admin-date-rule.md design

const { query } = require('../database/database');

class DateGenerationService {

  /**
   * 核心日期生成邏輯
   * @param {number} eventId - 事件 ID
   */
  async generateOccurrences(eventId) {
    const event = await this.getEvent(eventId);
    
    // 環境變數配置：可調整延伸年限
    const EXTEND_YEARS = parseInt(process.env.EXTEND_YEARS) || 5;
    
    // 統一時區處理：使用台灣時區
    const taiwanTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei"});
    const currentYear = new Date(taiwanTime).getFullYear();
    const targetYear = currentYear + EXTEND_YEARS;
    
    // 決定生成範圍：從 generated_until+1 或 currentYear 開始
    const startYear = event.generated_until ? 
      Math.max(event.generated_until + 1, currentYear) : currentYear;
    
    const newOccurrences = [];
    
    for (let year = startYear; year <= targetYear; year++) {
      if (event.one_time_date) {
        // 一次性活動：只有指定年份
        if (year === new Date(event.one_time_date).getFullYear()) {
          newOccurrences.push({
            event_id: eventId,
            occurrence_date: event.one_time_date,
            year,
            is_leap_month: false,
            rule_version: event.rule_version
          });
        }
      } else if (event.type === 'solar_term') {
        // 節氣事件：從 solar_terms 表查詢
        try {
          const solarTermDate = await this.getSolarTermDate(event.solar_term_name, year);
          if (solarTermDate) {
            newOccurrences.push({
              event_id: eventId,
              occurrence_date: solarTermDate,
              year,
              is_leap_month: false,
              rule_version: event.rule_version
            });
          }
        } catch (error) {
          await this.insertGenerationError({
            event_id: eventId,
            error_type: 'solar_term_lookup',
            error_message: error.message,
            retryable: true,
            context_data: { year, solar_term_name: event.solar_term_name }
          });
          throw error;
        }
      } else if (event.is_lunar) {
        // 農曆事件：處理閏月邏輯
        try {
          const dates = await this.calculateLunarDates(event, year);
          newOccurrences.push(...dates);
        } catch (error) {
          await this.insertGenerationError({
            event_id: eventId,
            error_type: 'lunar_conversion',
            error_message: error.message,
            retryable: !error.message.includes('invalid'),
            context_data: { year, lunar_month: event.lunar_month, lunar_day: event.lunar_day }
          });
          throw error;
        }
      } else {
        // 國曆事件
        const solarDate = new Date(year, event.solar_month - 1, event.solar_day);
        newOccurrences.push({
          event_id: eventId,
          occurrence_date: solarDate.toISOString().split('T')[0],
          year,
          is_leap_month: false,
          rule_version: event.rule_version
        });
      }
    }
    
    // 批量插入，使用 ON CONFLICT 避免重複
    if (newOccurrences.length > 0) {
      await this.insertOccurrencesWithConflictHandling(newOccurrences);
    }
    
    // 更新 generated_until
    await this.updateEvent(eventId, { generated_until: targetYear });
    
    return {
      success: true,
      occurrencesGenerated: newOccurrences.length
    };
  }

  /**
   * 計算農曆日期對應的國曆日期
   * @param {Object} event - 事件資料
   * @param {number} year - 目標年份
   */
  async calculateLunarDates(event, year) {
    const occurrences = [];
    
    // 平月日期
    if (event.leap_behavior !== 'always_leap') {
      try {
        const solarDate = await this.convertLunarToSolar(year, event.lunar_month, event.lunar_day, false);
        occurrences.push({
          event_id: event.id,
          occurrence_date: solarDate,
          year,
          is_leap_month: false,
          rule_version: event.rule_version
        });
      } catch (error) {
        await this.insertGenerationError({
          event_id: event.id,
          error_type: 'lunar_conversion',
          error_message: `平月轉換失敗: ${error.message}`,
          retryable: false,
          context_data: { year, lunar_month: event.lunar_month, lunar_day: event.lunar_day, is_leap: false }
        });
        throw error;
      }
    }
    
    // 閏月日期
    if (event.leap_behavior === 'always_leap' || event.leap_behavior === 'both') {
      try {
        const leapSolarDate = await this.convertLunarToSolar(year, event.lunar_month, event.lunar_day, true);
        occurrences.push({
          event_id: event.id,
          occurrence_date: leapSolarDate,
          year,
          is_leap_month: true,
          rule_version: event.rule_version
        });
      } catch (error) {
        // 閏月轉換失敗通常是該年無閏月，不算錯誤
        console.debug(`閏月轉換略過 ${year}/${event.lunar_month}/${event.lunar_day}: ${error.message}`);
      }
    }
    
    return occurrences;
  }

  /**
   * 農曆轉國曆（使用既有的 LunarCalendarService）
   */
  async convertLunarToSolar(year, month, day, isLeap = false) {
    const lunarCalendarService = require('./lunarCalendarService');
    const result = lunarCalendarService.convertToSolar({ year, month, day, isLeap });
    // convertToSolar returns an array, we take the first result
    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * 查詢節氣日期
   */
  async getSolarTermDate(termName, year) {
    const result = await query(`
      SELECT occurrence_date 
      FROM solar_terms 
      WHERE term_name = $1 AND year = $2
    `, [termName, year]);
    
    if (!result.rows.length) {
      // 如果資料庫中沒有該年度節氣資料，觸發補充邏輯
      await this.ensureSolarTermsData(year);
      
      // 重新查詢
      const retryResult = await query(`
        SELECT occurrence_date 
        FROM solar_terms 
        WHERE term_name = $1 AND year = $2
      `, [termName, year]);
      
      return retryResult.rows[0]?.occurrence_date;
    }
    
    return result.rows[0].occurrence_date;
  }

  /**
   * 確保節氣資料存在（5年範圍）
   */
  async ensureSolarTermsData(targetYear) {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 5; // 5年預載策略
    
    if (targetYear > maxYear) {
      throw new Error(`節氣資料超出支援範圍，最大年份：${maxYear}`);
    }
    
    // 檢查是否已有該年度資料
    const existingData = await query(`
      SELECT COUNT(*) as count 
      FROM solar_terms 
      WHERE year = $1
    `, [targetYear]);
    
    if (existingData.rows[0].count == 0) {
      // 觸發從中央氣象局匯入該年度資料
      await this.importSolarTermsFromCWB(targetYear);
    }
  }

  /**
   * 從中央氣象局匯入節氣資料（示範實作）
   */
  async importSolarTermsFromCWB(year) {
    // 示範資料 - 實際應從中央氣象局 API 獲取
    const sampleSolarTerms = {
      '立春': `${year}-02-04`,
      '雨水': `${year}-02-19`,
      '驚蟄': `${year}-03-06`,
      '春分': `${year}-03-20`,
      '清明': `${year}-04-05`,
      '穀雨': `${year}-04-20`,
      '立夏': `${year}-05-05`,
      '小滿': `${year}-05-21`,
      '芒種': `${year}-06-06`,
      '夏至': `${year}-06-21`,
      '小暑': `${year}-07-07`,
      '大暑': `${year}-07-23`,
      '立秋': `${year}-08-07`,
      '處暑': `${year}-08-23`,
      '白露': `${year}-09-08`,
      '秋分': `${year}-09-23`,
      '寒露': `${year}-10-08`,
      '霜降': `${year}-10-23`,
      '立冬': `${year}-11-07`,
      '小雪': `${year}-11-22`,
      '大雪': `${year}-12-07`,
      '冬至': `${year}-12-22`,
      '小寒': `${year + 1}-01-06`,
      '大寒': `${year + 1}-01-20`
    };

    for (const [termName, date] of Object.entries(sampleSolarTerms)) {
      await query(`
        INSERT INTO solar_terms (year, term_name, occurrence_date)
        VALUES ($1, $2, $3)
        ON CONFLICT (year, term_name) DO UPDATE SET
          occurrence_date = EXCLUDED.occurrence_date,
          imported_at = NOW()
      `, [year, termName, date]);
    }
  }

  /**
   * 年度自動維護機制 (每年 1/1 執行)
   */
  async annualMaintenanceJob() {
    const EXTEND_YEARS = parseInt(process.env.EXTEND_YEARS) || 5;
    
    const taiwanTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei"});
    const currentYear = new Date(taiwanTime).getFullYear();
    const targetYear = currentYear + EXTEND_YEARS;
    
    const maintenanceRecord = {
      maintenance_type: 'annual_extension',
      target_year: targetYear,
      events_processed: 0,
      occurrences_created: 0,
      occurrences_deleted: 0,
      solar_terms_processed: 0,
      status: 'running',
      started_at: new Date()
    };
    
    try {
      // 記錄維護開始
      const recordResult = await query(`
        INSERT INTO system_maintenance (maintenance_type, target_year, status, started_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [maintenanceRecord.maintenance_type, maintenanceRecord.target_year, 
          maintenanceRecord.status, maintenanceRecord.started_at]);
      
      const maintenanceId = recordResult.rows[0].id;
      
      // 1. 清理過期的 occurrence 資料 (時區安全處理)
      const cleanupDate = new Date(currentYear, 0, 1).toISOString().split('T')[0];
      const deleteResult = await query(`
        DELETE FROM event_occurrences 
        WHERE occurrence_date < $1
      `, [cleanupDate]);
      
      maintenanceRecord.occurrences_deleted = deleteResult.rowCount;
      
      // 2. 延伸所有需要更新的事件
      const eventsNeedExtension = await query(`
        SELECT id FROM events 
        WHERE generated_until IS NULL OR generated_until < $1
      `, [targetYear]);
      
      let totalCreatedOccurrences = 0;
      
      for (const event of eventsNeedExtension.rows) {
        const beforeCount = await this.getOccurrenceCount(event.id);
        await this.generateOccurrences(event.id);
        const afterCount = await this.getOccurrenceCount(event.id);
        totalCreatedOccurrences += (afterCount - beforeCount);
      }
      
      maintenanceRecord.events_processed = eventsNeedExtension.rows.length;
      maintenanceRecord.occurrences_created = totalCreatedOccurrences;
      
      // 3. 延伸節氣資料
      const solarTermYears = [];
      for (let year = currentYear; year <= targetYear; year++) {
        await this.ensureSolarTermsData(year);
        solarTermYears.push(year);
      }
      
      maintenanceRecord.solar_terms_processed = solarTermYears.length;
      
      // 4. 更新維護記錄為完成
      await query(`
        UPDATE system_maintenance 
        SET status = 'completed',
            completed_at = NOW(),
            events_processed = $1,
            occurrences_created = $2,
            occurrences_deleted = $3,
            solar_terms_processed = $4
        WHERE id = $5
      `, [maintenanceRecord.events_processed, maintenanceRecord.occurrences_created,
          maintenanceRecord.occurrences_deleted, maintenanceRecord.solar_terms_processed,
          maintenanceId]);
      
      console.log(`Annual maintenance completed:`, maintenanceRecord);
      return { success: true, ...maintenanceRecord };
      
    } catch (error) {
      // 記錄失敗
      await query(`
        UPDATE system_maintenance 
        SET status = 'failed',
            completed_at = NOW(),
            error_message = $1
        WHERE maintenance_type = 'annual_extension' 
          AND status = 'running'
          AND started_at >= $2
      `, [error.message, new Date(Date.now() - 60000)]);
      
      throw error;
    }
  }

  /**
   * 輔助函數：帶衝突處理的批量插入
   */
  async insertOccurrencesWithConflictHandling(occurrences) {
    const values = occurrences.map((occ, index) => 
      `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
    ).join(',');
    
    const params = occurrences.flatMap(occ => [
      occ.event_id, occ.occurrence_date, occ.year, occ.is_leap_month, occ.rule_version
    ]);
    
    await query(`
      INSERT INTO event_occurrences 
        (event_id, occurrence_date, year, is_leap_month, rule_version)
      VALUES ${values}
      ON CONFLICT (event_id, occurrence_date) DO NOTHING
    `, params);
  }

  /**
   * 輔助函數：插入錯誤記錄
   */
  async insertGenerationError(errorData) {
    await query(`
      INSERT INTO generation_errors 
        (event_id, error_type, error_message, retryable, context_data)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      errorData.event_id,
      errorData.error_type,
      errorData.error_message,
      errorData.retryable !== undefined ? errorData.retryable : true,
      JSON.stringify(errorData.context_data)
    ]);
  }

  /**
   * 輔助函數：獲取事件資料
   */
  async getEvent(eventId) {
    const result = await query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (!result.rows.length) {
      throw new Error(`Event not found: ${eventId}`);
    }
    return result.rows[0];
  }

  /**
   * 輔助函數：更新事件
   */
  async updateEvent(eventId, updates) {
    const setClause = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');
    
    await query(`
      UPDATE events 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
    `, [eventId, ...Object.values(updates)]);
  }

  /**
   * 輔助函數：獲取事件的 occurrence 數量
   */
  async getOccurrenceCount(eventId) {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM event_occurrences 
      WHERE event_id = $1
    `, [eventId]);
    
    return parseInt(result.rows[0].count);
  }

  /**
   * 每日 Cron Job 排程系統
   */
  async dailyOccurrenceGeneration() {
    const currentYear = new Date().getFullYear();
    const EXTEND_YEARS = parseInt(process.env.EXTEND_YEARS) || 5;
    
    // 查詢需要生成的事件
    const events = await query(`
      SELECT id, generated_until, rule_version 
      FROM events 
      WHERE generated_until IS NULL 
         OR generated_until < $1
    `, [currentYear + EXTEND_YEARS]);
    
    const results = { success: 0, failed: 0, errors: [] };
    
    for (const event of events.rows) {
      try {
        await this.generateOccurrences(event.id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ event_id: event.id, error: error.message });
        
        // 記錄到專門的錯誤表
        await this.insertGenerationError({
          event_id: event.id,
          error_type: 'cron_failure',
          error_message: error.message,
          retryable: !error.message.includes('invalid') && !error.message.includes('malformed'),
          context_data: { 
            rule_version: event.rule_version,
            generated_until: event.generated_until,
            current_year: currentYear 
          }
        });
      }
    }
    
    console.log(`Cron completed: ${results.success} success, ${results.failed} failed`);
    return results;
  }
}

module.exports = new DateGenerationService();