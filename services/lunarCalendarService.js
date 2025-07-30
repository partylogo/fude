// 農曆轉換服務
class LunarCalendarService {
  /**
   * 驗證農曆日期輸入
   * @param {Object} lunar - 農曆日期物件
   * @returns {Object} 驗證結果
   */
  static validateLunarDate(lunar) {
    if (!lunar || typeof lunar !== 'object') {
      return { isValid: false, error: 'Invalid lunar date input' };
    }

    const { month, day, year, isLeap } = lunar;

    if (!month || !day) {
      return { isValid: false, error: 'Month and day are required' };
    }

    if (month < 1 || month > 12) {
      return { isValid: false, error: 'Month must be between 1 and 12' };
    }

    if (day < 1 || day > 30) {
      return { isValid: false, error: 'Day must be between 1 and 30' };
    }

    return { isValid: true };
  }

  /**
   * 將農曆日期轉換為國曆日期
   * @param {Object} lunar - 農曆日期物件
   * @returns {Array<string>} 對應的國曆日期陣列
   */
  static convertToSolar(lunar) {
    // 目前使用 mock 資料，後續可整合真實的農曆轉換演算法
    const { month, day, year = 2025, isLeap = false } = lunar;
    
    // 常見農曆節日對照表 (mock data)
    const lunarToSolarMap = {
      '3-23': ['2025-04-20'], // 媽祖聖誕
      '1-1': ['2025-01-29'],  // 農曆新年
      '1-15': ['2025-02-12'], // 元宵節
      '3-15': ['2025-04-12'], // 財神爺生日
    };

    const key = `${month}-${day}`;
    
    if (lunarToSolarMap[key]) {
      return lunarToSolarMap[key];
    }

    // 簡單的模擬轉換 - 實際應用需要完整的農曆演算法
    const baseDate = new Date(year, month - 1, day);
    const solarDate = new Date(baseDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 大約加30天
    
    return [solarDate.toISOString().split('T')[0]];
  }

  /**
   * 格式化農曆日期顯示
   * @param {Object} lunar - 農曆日期物件
   * @returns {string} 格式化的農曆日期字串
   */
  static formatLunarDate(lunar) {
    const { month, day, isLeap = false } = lunar;
    const leapPrefix = isLeap ? '閏' : '';
    const monthNames = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    const dayNames = [
      '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];
    
    return `農曆${leapPrefix}${monthNames[month - 1]}月${dayNames[day - 1]}`;
  }
}

module.exports = LunarCalendarService;