// Event Repository - 資料存取層
const fs = require('fs');
const path = require('path');
const CACHE_PATH = path.join(__dirname, '..', 'data', 'eventsCache.json');
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
        // 嘗試從 JSON 快取載入
        let cached = null;
        try {
          if (fs.existsSync(CACHE_PATH)) {
            cached = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
          }
        } catch (err) {
          console.error('[EventRepository] 讀取快取失敗:', err);
        }
        global.__eventsStore = cached && Array.isArray(cached) && cached.length ? cached : [...mockEvents];
        global.__nextEventId = Math.max(0, ...global.__eventsStore.map(e => e.id)) + 1;

        // 在啟動時同步寫入快取，確保檔案存在
        try {
          fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
          fs.writeFileSync(CACHE_PATH, JSON.stringify(global.__eventsStore, null, 2));
        } catch (err) {
          console.error('[EventRepository] 寫入快取失敗:', err);
        }
      }
      this.events = global.__eventsStore;
      this.nextIdRef = () => global.__nextEventId++;
    }
  }

  /**
   * 將目前 events 寫入 JSON 快取（僅非測試環境）
   */
  persist() {
    if (process.env.NODE_ENV === 'test') return;
    try {
      fs.writeFileSync(CACHE_PATH, JSON.stringify(this.events, null, 2));
    } catch (err) {
      console.error('[EventRepository] 寫入快取失敗:', err);
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
    this.persist();
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
    this.persist();
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
    this.persist();
    return true;
  }
}

module.exports = EventRepository;
