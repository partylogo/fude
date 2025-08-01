// Event Repository - 資料存取層
const mockEvents = require('../data/mockEvents');

class EventRepository {
  constructor() {
    // 使用 mock data，之後可以替換為真實資料庫連接
    // 使用 module-level 共享陣列，確保跨請求持久
    if (process.env.NODE_ENV === 'test') {
      // 測試環境：每次重新複製 mock 資料，保持測試獨立
      this.events = JSON.parse(JSON.stringify(mockEvents));
      let nextId = Math.max(...this.events.map(e => e.id)) + 1;
      this.nextIdRef = () => nextId++;
    } else {
      // 開發 / 產品環境：使用全域共享陣列，確保跨請求持久
      if (!global.__eventsStore) {
        global.__eventsStore = [...mockEvents];
        global.__nextEventId = Math.max(...global.__eventsStore.map(e => e.id)) + 1;
      }
      this.events = global.__eventsStore;
      this.nextIdRef = () => global.__nextEventId++;
    }
    
  }

  /**
   * 取得所有事件
   * @returns {Promise<Array>} 事件陣列
   */
  async findAll() {
    return [...this.events];
  }

  /**
   * 根據日期範圍過濾事件
   * @param {string} from - 開始日期 (YYYY-MM-DD)
   * @param {string} to - 結束日期 (YYYY-MM-DD)
   * @returns {Promise<Array>} 過濾後的事件陣列
   */
  async findByDateRange(from, to) {
    return this.events.filter(event => {
      const eventDate = new Date(Array.isArray(event.solar_date) ? event.solar_date[0] : event.solar_date);
      
      let matchesFrom = true;
      let matchesTo = true;
      
      if (from) {
        const fromDate = new Date(from);
        matchesFrom = eventDate >= fromDate;
      }
      
      if (to) {
        const toDate = new Date(to);
        matchesTo = eventDate <= toDate;
      }
      
      return matchesFrom && matchesTo;
    });
  }

  /**
   * 根據類型過濾事件
   * @param {string} type - 事件類型
   * @returns {Promise<Array>} 過濾後的事件陣列
   */
  async findByType(type) {
    return this.events.filter(event => event.type === type);
  }

  /**
   * 根據 ID 查找事件
   * @param {number} id - 事件 ID
   * @returns {Promise<Object|null>} 事件物件或 null
   */
  async findById(id) {
    const event = this.events.find(e => e.id === id);
    return event || null;
  }

  /**
   * 建立新事件
   * @param {Object} eventData - 事件資料
   * @returns {Promise<Object>} 建立的事件物件
   */
  async create(eventData) {
    const newEvent = {
      id: this.nextIdRef(),
      ...eventData,
      solar_date: Array.isArray(eventData.solar_date) ? eventData.solar_date : [eventData.solar_date]
    };
    
    this.events.push(newEvent);
    return { ...newEvent };
  }

  /**
   * 更新事件
   * @param {number} id - 事件 ID
   * @param {Object} updateData - 更新資料
   * @returns {Promise<Object|null>} 更新的事件物件或 null
   */
  async update(id, updateData) {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) {
      return null;
    }
    
    this.events[index] = { ...this.events[index], ...updateData };
    return { ...this.events[index] };
  }

  /**
   * 刪除事件
   * @param {number} id - 事件 ID
   * @returns {Promise<boolean>} 是否成功刪除
   */
  async delete(id) {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) {
      return false;
    }
    
    this.events.splice(index, 1);
    return true;
  }
}

module.exports = EventRepository;