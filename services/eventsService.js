// Events 服務
class EventsService {
  /**
   * 根據日期範圍過濾事件
   * @param {Array} events - 事件陣列
   * @param {string} from - 開始日期 (YYYY-MM-DD)
   * @param {string} to - 結束日期 (YYYY-MM-DD)
   * @returns {Array} 過濾後的事件陣列
   */
  static filterByDateRange(events, from, to) {
    if (!from && !to) {
      return events;
    }

    return events.filter(event => {
      const eventDate = new Date(event.solar_date);
      
      // 檢查 from 日期
      if (from) {
        const fromDate = new Date(from);
        if (eventDate < fromDate) {
          return false;
        }
      }
      
      // 檢查 to 日期
      if (to) {
        const toDate = new Date(to);
        if (eventDate > toDate) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * 驗證日期格式
   * @param {string} dateString - 日期字串
   * @returns {boolean} 是否為有效日期
   */
  static isValidDateString(dateString) {
    if (!dateString) return true; // 空值視為有效（表示不過濾）
    
    // 檢查格式
    const formatMatch = dateString.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!formatMatch) return false;
    
    // 檢查日期是否有效
    const date = new Date(dateString);
    const isValidDate = !isNaN(date.getTime());
    
    if (!isValidDate) return false;
    
    // 確保日期轉換後與原始字串一致（避免 2025-02-30 這種無效日期）
    try {
      const reconstructed = date.toISOString().split('T')[0];
      return reconstructed === dateString;
    } catch (error) {
      return false;
    }
  }

  /**
   * 依類型分組事件
   * @param {Array} events - 事件陣列
   * @returns {Object} 按類型分組的事件
   */
  static groupByType(events) {
    return events.reduce((groups, event) => {
      const type = event.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(event);
      return groups;
    }, {});
  }
}

module.exports = EventsService;