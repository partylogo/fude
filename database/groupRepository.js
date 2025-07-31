// Group Repository - 群組資料存取層
const { mockGroups, mockGroupItems } = require('../data/mockGroups');
const mockEvents = require('../data/mockEvents');

class GroupRepository {
  constructor() {
    // 使用 mock data，之後可以替換為真實資料庫連接
    this.groups = [...mockGroups];
    this.groupItems = { ...mockGroupItems };
    this.events = [...mockEvents];
    this.nextId = Math.max(...this.groups.map(g => g.id)) + 1;
  }

  /**
   * 取得所有群組
   * @returns {Promise<Array>} 群組陣列
   */
  async findAll() {
    return [...this.groups];
  }

  /**
   * 取得啟用的群組
   * @returns {Promise<Array>} 啟用的群組陣列
   */
  async findEnabledGroups() {
    return this.groups.filter(group => group.enabled);
  }

  /**
   * 根據 ID 查找群組
   * @param {number} id - 群組 ID
   * @returns {Promise<Object|null>} 群組物件或 null
   */
  async findById(id) {
    const group = this.groups.find(g => g.id === id);
    return group || null;
  }

  /**
   * 取得群組包含的事件
   * @param {number} groupId - 群組 ID
   * @returns {Promise<Array>} 事件陣列
   */
  async getGroupEvents(groupId) {
    const eventIds = this.groupItems[groupId] || [];
    return this.events.filter(event => eventIds.includes(event.id));
  }

  /**
   * 取得群組事件並依類型分組
   * @param {number} groupId - 群組 ID
   * @returns {Promise<Object>} 分組後的事件物件 {deities: [], festivals: []}
   */
  async getGroupEventsByType(groupId) {
    const events = await this.getGroupEvents(groupId);
    
    const deities = events.filter(event => event.type === 'deity');
    const festivals = events.filter(event => event.type === 'festival');
    
    return {
      deities,
      festivals
    };
  }

  /**
   * 建立新群組
   * @param {Object} groupData - 群組資料
   * @returns {Promise<Object>} 建立的群組物件
   */
  async create(groupData) {
    const newGroup = {
      id: this.nextId++,
      ...groupData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.groups.push(newGroup);
    this.groupItems[newGroup.id] = []; // 初始化空的事件列表
    
    return { ...newGroup };
  }

  /**
   * 更新群組
   * @param {number} id - 群組 ID
   * @param {Object} updateData - 更新資料
   * @returns {Promise<Object|null>} 更新的群組物件或 null
   */
  async update(id, updateData) {
    const index = this.groups.findIndex(g => g.id === id);
    if (index === -1) {
      return null;
    }
    
    this.groups[index] = { 
      ...this.groups[index], 
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    return { ...this.groups[index] };
  }

  /**
   * 刪除群組
   * @param {number} id - 群組 ID
   * @returns {Promise<boolean>} 是否成功刪除
   */
  async delete(id) {
    const index = this.groups.findIndex(g => g.id === id);
    if (index === -1) {
      return false;
    }
    
    this.groups.splice(index, 1);
    delete this.groupItems[id]; // 同時刪除群組事件關聯
    
    return true;
  }

  /**
   * 將事件加入群組
   * @param {number} groupId - 群組 ID
   * @param {number} eventId - 事件 ID
   * @returns {Promise<boolean>} 是否成功加入
   */
  async addEventToGroup(groupId, eventId) {
    // 檢查群組和事件是否存在
    const group = await this.findById(groupId);
    const event = this.events.find(e => e.id === eventId);
    
    if (!group || !event) {
      return false;
    }
    
    // 初始化群組事件列表（如果不存在）
    if (!this.groupItems[groupId]) {
      this.groupItems[groupId] = [];
    }
    
    // 避免重複加入
    if (!this.groupItems[groupId].includes(eventId)) {
      this.groupItems[groupId].push(eventId);
    }
    
    return true;
  }

  /**
   * 從群組移除事件
   * @param {number} groupId - 群組 ID
   * @param {number} eventId - 事件 ID
   * @returns {Promise<boolean>} 是否成功移除
   */
  async removeEventFromGroup(groupId, eventId) {
    if (!this.groupItems[groupId]) {
      return false;
    }
    
    const index = this.groupItems[groupId].indexOf(eventId);
    if (index === -1) {
      return false;
    }
    
    this.groupItems[groupId].splice(index, 1);
    return true;
  }
}

module.exports = GroupRepository;