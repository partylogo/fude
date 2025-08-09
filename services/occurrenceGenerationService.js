// Phase 2: Occurrence 生成服務
// 支援 festival、custom 類型的日期生成，生成當年到當年+5年的 occurrences

const getSupabaseClient = require('../database/supabaseClient');

class OccurrenceGenerationService {
  constructor() {
    this.supabase = getSupabaseClient();
    this.EXTEND_YEARS = parseInt(process.env.EXTEND_YEARS) || 5;
  }

  /**
   * 為事件生成 occurrences
   * @param {Object} event - 事件物件
   * @param {Object} options - 選項 {startYear?, endYear?, force?}
   * @returns {Promise<Array>} 生成的 occurrences
   */
  async generateOccurrences(event, options = {}) {
    if (!this.supabase) {
      throw new Error('Supabase client not available for occurrence generation');
    }

    const currentYear = new Date().getFullYear();
    const startYear = options.startYear || currentYear;
    const endYear = options.endYear || (currentYear + this.EXTEND_YEARS);
    const force = options.force || false;

    console.log(`[OccurrenceGeneration] Generating occurrences for event ${event.id} (${event.type}) from ${startYear} to ${endYear}`);

    // 檢查是否已有 occurrences（除非強制重新生成）
    if (!force) {
      const { data: existingOccurrences } = await this.supabase
        .from('event_occurrences')
        .select('year')
        .eq('event_id', event.id)
        .eq('rule_version', event.rule_version || 1)
        .gte('year', startYear)
        .lte('year', endYear);

      if (existingOccurrences && existingOccurrences.length > 0) {
        console.log(`[OccurrenceGeneration] Event ${event.id} already has occurrences, skipping`);
        return existingOccurrences;
      }
    } else {
      // 強制重新生成：先刪除現有的 occurrences
      await this.supabase
        .from('event_occurrences')
        .delete()
        .eq('event_id', event.id)
        .eq('rule_version', event.rule_version || 1)
        .gte('year', startYear)
        .lte('year', endYear);
    }

    // 根據事件類型生成 occurrences
    const occurrences = [];
    
    switch (event.type) {
      case 'festival':
        occurrences.push(...this.generateFestivalOccurrences(event, startYear, endYear));
        break;
      case 'custom':
        occurrences.push(...this.generateCustomOccurrences(event, startYear, endYear));
        break;
      case 'solar_term':
        occurrences.push(...await this.generateSolarTermOccurrences(event, startYear, endYear));
        break;
      case 'deity':
        // Phase 2 暫不支援，留待 Phase 2 後期
        console.log(`[OccurrenceGeneration] deity type not supported in Phase 2`);
        return [];
      default:
        throw new Error(`Unsupported event type: ${event.type}`);
    }

    if (occurrences.length === 0) {
      console.log(`[OccurrenceGeneration] No occurrences generated for event ${event.id}`);
      return [];
    }

    // 批量插入到資料庫
    const { data, error } = await this.supabase
      .from('event_occurrences')
      .insert(occurrences)
      .select('*');

    if (error) {
      console.error('[OccurrenceGeneration] Failed to insert occurrences:', error);
      throw error;
    }

    console.log(`[OccurrenceGeneration] Generated ${occurrences.length} occurrences for event ${event.id}`);
    return data;
  }

  /**
   * 生成民俗節慶類型的 occurrences
   * @param {Object} event - 事件物件
   * @param {number} startYear - 開始年份
   * @param {number} endYear - 結束年份
   * @returns {Array} occurrences 陣列
   */
  generateFestivalOccurrences(event, startYear, endYear) {
    const occurrences = [];
    
    if (!event.solar_month || !event.solar_day) {
      throw new Error(`Festival event ${event.id} missing solar_month or solar_day`);
    }

    for (let year = startYear; year <= endYear; year++) {
      const month = String(event.solar_month).padStart(2, '0');
      const day = String(event.solar_day).padStart(2, '0');
      const occurrenceDate = `${year}-${month}-${day}`;

      // 驗證日期有效性
      const dateObj = new Date(occurrenceDate);
      if (dateObj.getFullYear() !== year || 
          dateObj.getMonth() + 1 !== event.solar_month ||
          dateObj.getDate() !== event.solar_day) {
        console.warn(`[OccurrenceGeneration] Invalid date ${occurrenceDate} for event ${event.id}, skipping`);
        continue;
      }

      occurrences.push({
        event_id: event.id,
        occurrence_date: occurrenceDate,
        year: year,
        is_leap_month: false, // 國曆固定為 false
        rule_version: event.rule_version || 1,
        generated_at: new Date().toISOString()
      });
    }

    return occurrences;
  }

  /**
   * 生成自訂事件類型的 occurrences
   * @param {Object} event - 事件物件
   * @param {number} startYear - 開始年份
   * @param {number} endYear - 結束年份
   * @returns {Array} occurrences 陣列
   */
  generateCustomOccurrences(event, startYear, endYear) {
    const occurrences = [];
    
    if (!event.one_time_date) {
      throw new Error(`Custom event ${event.id} missing one_time_date`);
    }

    const oneTimeDate = new Date(event.one_time_date);
    const eventYear = oneTimeDate.getFullYear();

    // 一次性事件只在指定年份發生
    if (eventYear >= startYear && eventYear <= endYear) {
      occurrences.push({
        event_id: event.id,
        occurrence_date: event.one_time_date,
        year: eventYear,
        is_leap_month: false,
        rule_version: event.rule_version || 1,
        generated_at: new Date().toISOString()
      });
    }

    return occurrences;
  }

  /**
   * 生成節氣類型的 occurrences
   * @param {Object} event - 事件物件
   * @param {number} startYear - 開始年份
   * @param {number} endYear - 結束年份
   * @returns {Array} occurrences 陣列
   */
  async generateSolarTermOccurrences(event, startYear, endYear) {
    const occurrences = [];

    if (!event.solar_term_name) {
      console.warn(`[OccurrenceGeneration] solar_term event ${event.id} missing solar_term_name`);
      return occurrences;
    }

    // 基本的節氣日期對應（簡化版，之後可從 solar_terms 表查詢）
    const solarTermDates = {
      '立春': '02-04', '雨水': '02-19', '驚蟄': '03-06', '春分': '03-21',
      '清明': '04-05', '穀雨': '04-20', '立夏': '05-06', '小滿': '05-21',
      '芒種': '06-06', '夏至': '06-21', '小暑': '07-07', '大暑': '07-23',
      '立秋': '08-08', '處暑': '08-23', '白露': '09-08', '秋分': '09-23',
      '寒露': '10-08', '霜降': '10-23', '立冬': '11-07', '小雪': '11-22',
      '大雪': '12-07', '冬至': '12-22', '小寒': '01-06', '大寒': '01-20'
    };

    const termDate = solarTermDates[event.solar_term_name];
    if (!termDate) {
      console.warn(`[OccurrenceGeneration] Unknown solar term: ${event.solar_term_name}`);
      return occurrences;
    }

    // 為每一年生成節氣日期
    for (let year = startYear; year <= endYear; year++) {
      occurrences.push({
        event_id: event.id,
        occurrence_date: `${year}-${termDate}`,
        year: year,
        is_leap_month: false, // 節氣事件不涉及農曆閏月
        rule_version: event.rule_version || 1,
        generated_at: new Date().toISOString()
      });
    }

    return occurrences;
  }

  /**
   * 獲取事件的下一個發生日期
   * @param {number} eventId - 事件 ID
   * @param {Date} afterDate - 在此日期之後
   * @returns {Promise<Object|null>} 下一個 occurrence 或 null
   */
  async getNextOccurrence(eventId, afterDate = new Date()) {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from('event_occurrences')
      .select('*')
      .eq('event_id', eventId)
      .gte('occurrence_date', afterDate.toISOString().split('T')[0])
      .order('occurrence_date', { ascending: true })
      .limit(1);

    if (error) {
      console.error('[OccurrenceGeneration] Failed to get next occurrence:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * 獲取年度範圍內的 occurrences
   * @param {number} eventId - 事件 ID
   * @param {number} year - 年份
   * @returns {Promise<Array>} occurrences 陣列
   */
  async getOccurrencesByYear(eventId, year) {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('event_occurrences')
      .select('*')
      .eq('event_id', eventId)
      .eq('year', year)
      .order('occurrence_date', { ascending: true });

    if (error) {
      console.error('[OccurrenceGeneration] Failed to get occurrences by year:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 清理指定事件的所有 occurrences
   * @param {number} eventId - 事件 ID
   * @param {number} ruleVersion - 規則版本（可選）
   * @returns {Promise<boolean>} 是否成功
   */
  async clearOccurrences(eventId, ruleVersion = null) {
    if (!this.supabase) return false;

    let query = this.supabase
      .from('event_occurrences')
      .delete()
      .eq('event_id', eventId);

    if (ruleVersion !== null) {
      query = query.eq('rule_version', ruleVersion);
    }

    const { error } = await query;

    if (error) {
      console.error('[OccurrenceGeneration] Failed to clear occurrences:', error);
      return false;
    }

    console.log(`[OccurrenceGeneration] Cleared occurrences for event ${eventId}`);
    return true;
  }

  /**
   * 檢查並生成缺失的 occurrences
   * @param {Object} event - 事件物件
   * @returns {Promise<boolean>} 是否成功
   */
  async ensureOccurrences(event) {
    try {
      const currentYear = new Date().getFullYear();
      const targetYear = currentYear + this.EXTEND_YEARS;
      
      // 檢查是否已經生成到目標年份
      const { data: maxYearData } = await this.supabase
        .from('event_occurrences')
        .select('year')
        .eq('event_id', event.id)
        .eq('rule_version', event.rule_version || 1)
        .order('year', { ascending: false })
        .limit(1);

      const maxYear = maxYearData && maxYearData.length > 0 ? maxYearData[0].year : currentYear - 1;

      if (maxYear >= targetYear) {
        return true; // 已經生成足夠
      }

      // 生成缺失的年份
      await this.generateOccurrences(event, {
        startYear: Math.max(currentYear, maxYear + 1),
        endYear: targetYear
      });

      return true;
    } catch (error) {
      console.error('[OccurrenceGeneration] Failed to ensure occurrences:', error);
      return false;
    }
  }
}

module.exports = OccurrenceGenerationService;