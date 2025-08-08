// Group Repository - 群組資料存取層
const { mockGroups, mockGroupItems } = require('../data/mockGroups');
const mockEvents = require('../data/mockEvents');
const getSupabaseClient = require('./supabaseClient');

class GroupRepository {
  constructor() {
    this.supabase = getSupabaseClient();
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
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('groups')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        return data || [];
      } catch (err) {
        if (isSchemaMissing(err)) this.supabase = null; else throw err;
      }
    }
    return [...this.groups];
  }

  /**
   * 取得啟用的群組
   * @returns {Promise<Array>} 啟用的群組陣列
   */
  async findEnabledGroups() {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('groups')
          .select('*')
          .eq('enabled', true)
          .order('id', { ascending: true });
        if (error) throw error;
        return data || [];
      } catch (err) {
        if (isSchemaMissing(err)) this.supabase = null; else throw err;
      }
    }
    return this.groups.filter(group => group.enabled);
  }

  /**
   * 根據 ID 查找群組
   * @param {number} id - 群組 ID
   * @returns {Promise<Object|null>} 群組物件或 null
   */
  async findById(id) {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
      } catch (err) {
        if (isSchemaMissing(err)) this.supabase = null; else throw err;
      }
    }
    const group = this.groups.find(g => g.id === id);
    return group || null;
  }

  /**
   * 取得群組包含的事件
   * @param {number} groupId - 群組 ID
   * @returns {Promise<Array>} 事件陣列
   */
  async getGroupEvents(groupId) {
    if (this.supabase) {
      try {
        const { data: items, error: errItems } = await this.supabase
          .from('group_items')
          .select('event_id')
          .eq('group_id', groupId);
        if (errItems) throw errItems;
        const ids = (items || []).map(i => i.event_id);
        if (ids.length === 0) return [];
        const { data: events, error: errEvents } = await this.supabase
          .from('events')
          .select('*')
          .in('id', ids);
        if (errEvents) throw errEvents;
        return events || [];
      } catch (err) {
        if (isSchemaMissing(err)) this.supabase = null; else throw err;
      }
    }
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
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('groups')
          .insert({ ...groupData })
          .select('*')
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        if (isSchemaMissing(err)) this.supabase = null; else throw err;
      }
    }
    const newGroup = {
      id: this.nextId++,
      ...groupData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.groups.push(newGroup);
    this.groupItems[newGroup.id] = [];
    return { ...newGroup };
  }

  /**
   * 更新群組
   * @param {number} id - 群組 ID
   * @param {Object} updateData - 更新資料
   * @returns {Promise<Object|null>} 更新的群組物件或 null
   */
  async update(id, updateData) {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('groups')
          .update({ ...updateData })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        if (isSchemaMissing(err)) this.supabase = null; else throw err;
      }
    }
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
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('groups')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        if (isSchemaMissing(err)) this.supabase = null; else throw err;
      }
    }
    const index = this.groups.findIndex(g => g.id === id);
    if (index === -1) {
      return false;
    }
    this.groups.splice(index, 1);
    delete this.groupItems[id];
    return true;
  }

  /**
   * 將事件加入群組
   * @param {number} groupId - 群組 ID
   * @param {number} eventId - 事件 ID
   * @returns {Promise<boolean>} 是否成功加入
   */
  async addEventToGroup(groupId, eventId) {
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('group_items')
          .insert({ group_id: groupId, event_id: eventId });
        if (error) return false;
        return true;
      } catch (err) {
        if (isSchemaMissing(err)) this.supabase = null; else return false;
      }
    }
    const group = await this.findById(groupId);
    const event = this.events.find(e => e.id === eventId);
    if (!group || !event) {
      return false;
    }
    if (!this.groupItems[groupId]) {
      this.groupItems[groupId] = [];
    }
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
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('group_items')
          .delete()
          .eq('group_id', groupId)
          .eq('event_id', eventId);
        if (error) return false;
        return true;
      } catch (err) {
        if (isSchemaMissing(err)) this.supabase = null; else return false;
      }
    }
    if (!this.groupItems[groupId]) return false;
    const index = this.groupItems[groupId].indexOf(eventId);
    if (index === -1) return false;
    this.groupItems[groupId].splice(index, 1);
    return true;
  }
}

function isSchemaMissing(err) {
  return err && (err.code === 'PGRST205' || err.code === '42P01' || /schema cache/i.test(String(err.message)) || /relation .* does not exist/i.test(String(err.message)));
}

module.exports = GroupRepository;