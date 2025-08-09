// 兼容性包裝器 - 無縫遷移到新農曆系統
// 自動生成於: 2025-08-09T06:44:40.299Z

const ModernLunarCalendarService = require('./modernLunarCalendarService');

// 保持向後兼容的 API
class LunarCalendarService {
  /**
   * 驗證農曆日期輸入
   * @param {Object} lunar - 農曆日期物件
   * @returns {Object} 驗證結果
   */
  static validateLunarDate(lunar) {
    return ModernLunarCalendarService.validateLunarDate(lunar);
  }

  /**
   * 將農曆日期轉換為國曆日期
   * @param {Object} lunar - 農曆日期物件
   * @returns {Array<string>} 對應的國曆日期陣列
   */
  static convertToSolar(lunar) {
    // 注意: 這現在是異步操作，但為了向後兼容保持同步介面
    const service = new ModernLunarCalendarService();
    
    // 使用同步降級方案保持兼容性
    try {
      return service.fallbackConversion(lunar);
    } catch (error) {
      console.error('[LunarWrapper] Fallback conversion failed:', error);
      return [];
    }
  }

  /**
   * 異步轉換方法（推薦使用）
   * @param {Object} lunar - 農曆日期物件
   * @returns {Promise<Array<string>>} 對應的國曆日期陣列
   */
  static async convertToSolarAsync(lunar) {
    const service = new ModernLunarCalendarService();
    return await service.convertToSolarAsync(lunar);
  }

  /**
   * 格式化農曆日期顯示
   * @param {Object} lunar - 農曆日期物件
   * @returns {string} 格式化的農曆日期字串
   */
  static formatLunarDate(lunar) {
    return ModernLunarCalendarService.formatLunarDate(lunar);
  }
}

module.exports = LunarCalendarService;
