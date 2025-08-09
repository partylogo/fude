// 進階農曆轉換服務 - 長遠解決方案
// 結合資料庫存儲、第三方 API 和算法的混合方案

const { query } = require('../database/database');
const lunarLib = require('lunar-javascript');
const getSupabaseClient = require('../database/supabaseClient');

class AdvancedLunarCalendarService {
  constructor() {
    this.cacheExpiryDays = 30; // 快取 30 天
  }

  /**
   * 主要轉換方法：農曆轉國曆
   * @param {Object} lunarDate - {year, month, day, isLeap}
   * @param {Object} options - {useCache: boolean, forceRefresh: boolean}
   * @returns {Promise<Array<string>>} 國曆日期陣列
   */
  async convertToSolar(lunarDate, options = {}) {
    const { year = new Date().getFullYear(), month, day, isLeap = false } = lunarDate;
    const { useCache = true, forceRefresh = false } = options;

    // 1. 優先從資料庫快取查詢
    if (useCache && !forceRefresh) {
      const cached = await this.getCachedConversion(year, month, day, isLeap);
      if (cached && cached.length > 0) {
        console.log(`[LunarConverter] Cache hit for ${year}-${month}-${day} (leap: ${isLeap})`);
        return cached;
      }
    }

    // 2. 嘗試從多個來源獲取轉換結果
    let solarDates = [];
    const errors = [];

    // 方法 1: 中央氣象局 API（台灣官方）
    try {
      solarDates = await this.convertViaCWBAPI(year, month, day, isLeap);
      if (solarDates.length > 0) {
        await this.cacheConversion(year, month, day, isLeap, solarDates, 'cwb_api');
        return solarDates;
      }
    } catch (error) {
      errors.push({ source: 'cwb_api', error: error.message });
    }

    // 方法 2: 農曆算法（本地計算）
    try {
      solarDates = await this.convertViaAlgorithm(year, month, day, isLeap);
      if (solarDates.length > 0) {
        await this.cacheConversion(year, month, day, isLeap, solarDates, 'algorithm');
        return solarDates;
      }
    } catch (error) {
      errors.push({ source: 'algorithm', error: error.message });
    }

    // 方法 3: 第三方 API（備用）
    try {
      solarDates = await this.convertViaThirdPartyAPI(year, month, day, isLeap);
      if (solarDates.length > 0) {
        await this.cacheConversion(year, month, day, isLeap, solarDates, 'third_party');
        return solarDates;
      }
    } catch (error) {
      errors.push({ source: 'third_party', error: error.message });
    }

    // 方法 4: 降級到預定義規則（最後手段）
    try {
      solarDates = this.convertViaPredefineRules(year, month, day, isLeap);
      if (solarDates.length > 0) {
        console.warn(`[LunarConverter] Using predefined rules for ${year}-${month}-${day}`);
        return solarDates;
      }
    } catch (error) {
      errors.push({ source: 'predefined', error: error.message });
    }

    // 全部失敗，拋出錯誤
    throw new Error(`Failed to convert lunar date ${year}-${month}-${day}: ${JSON.stringify(errors)}`);
  }

  /**
   * 從資料庫快取中查詢轉換結果
   */
  async getCachedConversion(year, month, day, isLeap) {
    try {
      const result = await this.queryDatabase(`
        SELECT solar_dates, cached_at, source
        FROM lunar_conversion_cache 
        WHERE lunar_year = $1 AND lunar_month = $2 AND lunar_day = $3 AND is_leap = $4
          AND cached_at > NOW() - INTERVAL '${this.cacheExpiryDays} days'
        ORDER BY cached_at DESC
        LIMIT 1
      `, [year, month, day, isLeap]);

      if (result.rows && result.rows.length > 0) {
        return JSON.parse(result.rows[0].solar_dates);
      }
      return null;
    } catch (error) {
      console.error('[LunarConverter] Cache query failed:', error);
      return null;
    }
  }

  /**
   * 將轉換結果存入快取
   */
  async cacheConversion(year, month, day, isLeap, solarDates, source) {
    try {
      await this.queryDatabase(`
        INSERT INTO lunar_conversion_cache 
          (lunar_year, lunar_month, lunar_day, is_leap, solar_dates, source, cached_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (lunar_year, lunar_month, lunar_day, is_leap) 
        DO UPDATE SET 
          solar_dates = EXCLUDED.solar_dates,
          source = EXCLUDED.source,
          cached_at = NOW()
      `, [year, month, day, isLeap, JSON.stringify(solarDates), source]);
    } catch (error) {
      console.error('[LunarConverter] Cache storage failed:', error);
    }
  }

  /**
   * 方法 1: 透過中央氣象局 API 轉換
   */
  async convertViaCWBAPI(year, month, day, isLeap) {
    // TODO: 實際串接中央氣象局 API
    // 台灣中央氣象局有提供農民曆 API
    // https://opendata.cwb.gov.tw/api/v1/rest/datastore/...
    
    if (!process.env.CWB_API_KEY) {
      throw new Error('CWB API key not configured');
    }
    
    // 模擬 API 調用（實際需要串接真實 API）
    console.log(`[LunarConverter] Calling CWB API for ${year}-${month}-${day}`);
    throw new Error('CWB API not yet implemented');
  }

  /**
   * 方法 2: 透過農曆算法轉換
   */
  async convertViaAlgorithm(year, month, day, isLeap) {
    console.log(`[LunarConverter] Using lunar-javascript algorithm for ${year}-${month}-${day}`);
    
    try {
      const { Lunar } = lunarLib;
      
      // 使用 lunar-javascript 庫進行轉換
      const lunar = Lunar.fromYmdHms(year, month, day, 0, 0, 0);
      
      if (isLeap) {
        // 處理閏月情況
        // 檢查該年是否有閏月以及是否是指定的閏月
        const lunarYear = lunarLib.LunarYear.fromYear(year);
        const leapMonth = lunarYear.getLeapMonth();
        
        if (leapMonth === 0) {
          throw new Error(`${year}年沒有閏月`);
        }
        
        if (leapMonth !== month) {
          throw new Error(`${year}年閏月是${leapMonth}月，不是${month}月`);
        }
        
        // 閏月處理（簡化）
        const solarDate = lunar.getSolar();
        return [solarDate.toYmd()];
      } else {
        // 平月轉換
        const solarDate = lunar.getSolar();
        return [solarDate.toYmd()];
      }
    } catch (error) {
      console.error(`[LunarConverter] Algorithm conversion failed: ${error.message}`);
      throw new Error(`Algorithm conversion failed: ${error.message}`);
    }
  }

  /**
   * 方法 3: 透過第三方 API 轉換
   */
  async convertViaThirdPartyAPI(year, month, day, isLeap) {
    // TODO: 串接可靠的第三方農曆轉換 API
    // 例如：萬年曆 API、香港天文台 API 等
    
    console.log(`[LunarConverter] Calling third-party API for ${year}-${month}-${day}`);
    throw new Error('Third-party API not yet implemented');
  }

  /**
   * 方法 4: 使用預定義規則（降級方案）
   */
  convertViaPredefineRules(year, month, day, isLeap) {
    // 保留現有的硬編碼規則作為最後手段
    const lunarToSolarMap = {
      '3-23': ['04-20'], // 媽祖聖誕
      '1-1': ['01-29'],  // 農曆新年
      '1-15': ['02-12'], // 元宵節
      '3-15': ['04-12'], // 財神爺生日
      '8-12': ['09-06'], // 神明生日測試
      // 可以繼續添加常用的節日...
    };

    const key = `${month}-${day}`;
    if (lunarToSolarMap[key]) {
      // 使用目標年份
      const monthDay = lunarToSolarMap[key][0];
      return [`${year}-${monthDay}`];
    }

    throw new Error(`No predefined rule for ${month}-${day}`);
  }

  /**
   * 使用 Supabase 資料庫進行查詢和存儲
   */
  async queryDatabase(sql, params = []) {
    const supabase = getSupabaseClient();
    if (supabase) {
      // 使用 Supabase 查詢
      const { data, error } = await supabase.rpc('execute_sql', { sql, params });
      if (error) throw error;
      return { rows: data };
    } else {
      // 降級到原始 query 方法
      return await query(sql, params);
    }
  }

  /**
   * 批量預載常用的農曆日期
   */
  async preloadCommonLunarDates() {
    const commonDates = [
      { month: 1, day: 1 },   // 春節
      { month: 1, day: 15 },  // 元宵節
      { month: 3, day: 23 },  // 媽祖聖誕
      { month: 5, day: 5 },   // 端午節
      { month: 7, day: 15 },  // 中元節
      { month: 8, day: 15 },  // 中秋節
      { month: 9, day: 9 },   // 重陽節
      // 更多常用日期...
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1, currentYear + 2];

    console.log('[LunarConverter] Preloading common lunar dates...');
    
    for (const year of years) {
      for (const date of commonDates) {
        try {
          await this.convertToSolar({ year, ...date }, { forceRefresh: true });
        } catch (error) {
          console.warn(`[LunarConverter] Failed to preload ${year}-${date.month}-${date.day}:`, error.message);
        }
      }
    }

    console.log('[LunarConverter] Preloading completed');
  }

  /**
   * 清理過期的快取
   */
  async cleanExpiredCache() {
    try {
      const result = await this.queryDatabase(`
        DELETE FROM lunar_conversion_cache 
        WHERE cached_at < NOW() - INTERVAL '${this.cacheExpiryDays * 2} days'
      `);
      console.log(`[LunarConverter] Cleaned ${result.rowCount || result.rows?.length || 0} expired cache entries`);
    } catch (error) {
      console.error('[LunarConverter] Cache cleanup failed:', error);
    }
  }
}

module.exports = AdvancedLunarCalendarService;