// Groups 服務
class GroupsService {
  /**
   * 取得所有群組
   * @param {Array} groups - 群組陣列
   * @returns {Array} 啟用的群組列表
   */
  static getAllGroups(groups) {
    return groups.filter(group => group.enabled);
  }

  /**
   * 根據 ID 取得群組
   * @param {Array} groups - 群組陣列
   * @param {number} groupId - 群組 ID
   * @returns {Object|null} 群組物件或 null
   */
  static getGroupById(groups, groupId) {
    return groups.find(group => group.id === groupId) || null;
  }

  /**
   * 取得群組包含的事件
   * @param {number} groupId - 群組 ID
   * @param {Object} groupItems - 群組事件對應表
   * @param {Array} events - 事件陣列
   * @returns {Array} 群組包含的事件陣列
   */
  static getGroupEvents(groupId, groupItems, events) {
    const eventIds = groupItems[groupId] || [];
    return events.filter(event => eventIds.includes(event.id));
  }

  /**
   * 將事件依類型分組
   * @param {Array} events - 事件陣列
   * @returns {Object} 分組後的事件物件 {deities: [], festivals: []}
   */
  static groupEventsByType(events) {
    const deities = events.filter(event => event.type === 'deity');
    const festivals = events.filter(event => event.type === 'festival');
    
    return {
      deities,
      festivals
    };
  }

  /**
   * 驗證群組 ID
   * @param {string|number} groupId - 群組 ID
   * @returns {Object} 驗證結果
   */
  static validateGroupId(groupId) {
    const id = parseInt(groupId);
    
    if (isNaN(id) || id <= 0) {
      return { 
        isValid: false, 
        error: 'Invalid group ID' 
      };
    }
    
    return { 
      isValid: true, 
      id 
    };
  }

  /**
   * 取得群組統計資訊
   * @param {Array} events - 群組事件陣列
   * @returns {Object} 統計資訊
   */
  static getGroupStats(events) {
    const stats = {
      total: events.length,
      deities: events.filter(e => e.type === 'deity').length,
      festivals: events.filter(e => e.type === 'festival').length,
      custom: events.filter(e => e.type === 'custom').length
    };
    
    return stats;
  }
}

module.exports = GroupsService;