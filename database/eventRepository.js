// Event Repository - 資料存取層
const fs = require('fs');
const path = require('path');
const CACHE_PATH = path.join(__dirname, '..', 'data', 'eventsCache.json');
const mockEvents = require('../data/mockEvents');
const getSupabaseClient = require('./supabaseClient');
const IS_SERVERLESS = !!process.env.VERCEL || process.env.NOW_BUILDER === '1';

class EventRepository {
  constructor() {
    // 使用 Supabase（若環境提供），否則 fallback 到 mock + file cache
    this.supabase = getSupabaseClient();
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
        // Serverless 環境禁止寫入檔案系統
        if (!IS_SERVERLESS) {
          try {
            fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
            fs.writeFileSync(CACHE_PATH, JSON.stringify(global.__eventsStore, null, 2));
          } catch (err) {
            console.error('[EventRepository] 寫入快取失敗:', err);
          }
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
    if (process.env.NODE_ENV === 'test' || IS_SERVERLESS) return;
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
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('events')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        return (data || []).map(normalizeDbEvent);
      } catch (err) {
        // 任何 supabase 錯誤一律回退，避免 500 阻斷 Admin
        this.supabase = null;
      }
    }
    return [...this.events];
  }

  /**
   * 根據日期範圍過濾事件
   * @param {string} from - 開始日期 (YYYY-MM-DD)
   * @param {string} to - 結束日期 (YYYY-MM-DD)
   * @returns {Promise<Array>} 過濾後的事件陣列
   */
  async findByDateRange(from, to) {
    if (this.supabase) {
      try {
        let query = this.supabase.from('events').select('*');
        if (from) query = query.gte('solar_date', from);
        if (to) query = query.lte('solar_date', to);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(normalizeDbEvent);
      } catch (err) {
        this.supabase = null;
      }
    }
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
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('events')
          .select('*')
          .eq('type', type);
        if (error) throw error;
        return (data || []).map(normalizeDbEvent);
      } catch (err) {
        this.supabase = null;
      }
    }
    return this.events.filter(event => event.type === type);
  }

  /**
   * 根據 ID 查找事件
   * @param {number} id - 事件 ID
   * @returns {Promise<Object|null>} 事件物件或 null
   */
  async findById(id) {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();
        if (error && error.code !== 'PGRST116') throw error; // not found
        return data ? normalizeDbEvent(data) : null;
      } catch (err) {
        this.supabase = null;
      }
    }
    const event = this.events.find(e => e.id === id);
    return event || null;
  }

  /**
   * 建立新事件
   * @param {Object} eventData - 事件資料
   * @returns {Promise<Object>} 建立的事件物件
   */
  async create(eventData) {
    if (this.supabase) {
      try {
        const payload = dbPayloadFromEventData(eventData);
        const { data, error } = await this.supabase
          .from('events')
          .insert(payload)
          .select('*')
          .single();
        if (error) throw error;
        return normalizeDbEvent(data);
      } catch (err) {
        console.error('[EventRepository.create] supabase error, falling back to memory:', err);
        // 無論何種錯誤皆回退至 in-memory，以保障 API 可用性（部署早期）
        this.supabase = null;
      }
    }
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
    if (this.supabase) {
      try {
        const payload = dbPayloadFromEventData(updateData);
        const { data, error } = await this.supabase
          .from('events')
          .update(payload)
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return normalizeDbEvent(data);
      } catch (err) {
        console.error('[EventRepository.update] supabase error, falling back to memory:', err);
        this.supabase = null;
      }
    }
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
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('events')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        if (isSchemaMissing(err)) {
          this.supabase = null;
        } else {
          throw err;
        }
      }
    }
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) {
      return false;
    }
    this.events.splice(index, 1);
    this.persist();
    return true;
  }
}

// Helpers
function normalizeDbEvent(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    // 規則欄位（前端表單所需）
    is_lunar: row.is_lunar ?? null,
    leap_behavior: row.leap_behavior ?? null,
    lunar_month: row.lunar_month ?? null,
    lunar_day: row.lunar_day ?? null,
    is_leap_month: row.is_leap_month ?? false,
    solar_month: row.solar_month ?? null,
    solar_day: row.solar_day ?? null,
    one_time_date: row.one_time_date ?? null,
    solar_term_name: row.solar_term_name ?? null,
    solar_date: Array.isArray(row.solar_date) ? row.solar_date : (row.solar_date ? [row.solar_date] : []),
    cover_url: row.cover_url ?? null,
    deity_role: row.deity_role ?? null,
    worship_notes: row.worship_notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function dbPayloadFromEventData(data) {
  const payload = { ...data };
  if (payload.solar_date && !Array.isArray(payload.solar_date)) {
    payload.solar_date = [payload.solar_date];
  }
  return payload;
}

function isSchemaMissing(err) {
  return err && (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    /schema cache/i.test(String(err.message)) ||
    /relation .* does not exist/i.test(String(err.message)) ||
    /column .* does not exist/i.test(String(err.message))
  );
}

module.exports = EventRepository;
