// Admin 顯示對齊測試 - 驗證前端使用 API v2 和 next_occurrence_date
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

describe('Admin 顯示對齊測試', () => {
  let testEventIds = [];

  afterAll(async () => {
    // 清理測試數據
    for (const id of testEventIds) {
      try {
        await fetch(`${API_BASE_URL}/events/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn(`Failed to clean up test event ${id}:`, e.message);
      }
    }
  });

  it('API v2 - festival 事件應該有 next_occurrence_date 和 rule_fields', async () => {
    // 創建 festival 事件
    const festivalData = {
      title: 'Test Festival Admin Display',
      type: 'festival',
      description: 'Test festival for admin display',
      solar_month: 12,
      solar_day: 25
    };

    const createResponse = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'api-version': 'v2' // 使用 v2 API
      },
      body: JSON.stringify(festivalData)
    });

    expect(createResponse.ok).toBe(true);
    const createdEvent = await createResponse.json();
    testEventIds.push(createdEvent.id);

    // 驗證創建的事件有 v2 格式
    expect(createdEvent).toHaveProperty('next_occurrence_date');
    expect(createdEvent).toHaveProperty('rule_fields');
    expect(createdEvent.rule_fields.solar_month).toBe(12);
    expect(createdEvent.rule_fields.solar_day).toBe(25);

    // 測試 GET 單個事件也有 v2 格式
    const getResponse = await fetch(`${API_BASE_URL}/events/${createdEvent.id}`, {
      headers: { 'api-version': 'v2' }
    });
    expect(getResponse.ok).toBe(true);
    const getEvent = await getResponse.json();

    expect(getEvent).toHaveProperty('next_occurrence_date');
    expect(getEvent).toHaveProperty('rule_fields');
    expect(getEvent.rule_fields.solar_month).toBe(12);
    expect(getEvent.rule_fields.solar_day).toBe(25);
  });

  it('API v2 - custom 事件應該有正確的 rule_fields', async () => {
    const customData = {
      title: 'Test Custom Admin Display',
      type: 'custom',
      description: 'Test custom event',
      one_time_date: '2025-06-15'
    };

    const createResponse = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'api-version': 'v2'
      },
      body: JSON.stringify(customData)
    });

    expect(createResponse.ok).toBe(true);
    const createdEvent = await createResponse.json();
    testEventIds.push(createdEvent.id);

    expect(createdEvent).toHaveProperty('next_occurrence_date');
    expect(createdEvent).toHaveProperty('rule_fields');
    expect(createdEvent.rule_fields.one_time_date).toBe('2025-06-15');
  });

  it('API v2 - deity 事件應該有農曆 rule_fields', async () => {
    const deityData = {
      title: 'Test Deity Admin Display',
      type: 'deity',
      description: 'Test deity event',
      lunar_month: 3,
      lunar_day: 23,
      is_leap_month: false,
      leap_behavior: 'both'
    };

    const createResponse = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'api-version': 'v2'
      },
      body: JSON.stringify(deityData)
    });

    expect(createResponse.ok).toBe(true);
    const createdEvent = await createResponse.json();
    testEventIds.push(createdEvent.id);

    expect(createdEvent).toHaveProperty('rule_fields');
    expect(createdEvent.rule_fields.lunar_month).toBe(3);
    expect(createdEvent.rule_fields.lunar_day).toBe(23);
    expect(createdEvent.rule_fields.is_leap_month).toBe(false);
    expect(createdEvent.rule_fields.leap_behavior).toBe('both');
  });

  it('API v2 - solar_term 事件應該有節氣 rule_fields', async () => {
    const solarTermData = {
      title: 'Test Solar Term Admin Display',
      type: 'solar_term',
      description: 'Test solar term event',
      solar_term_name: '冬至'
    };

    const createResponse = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'api-version': 'v2'
      },
      body: JSON.stringify(solarTermData)
    });

    expect(createResponse.ok).toBe(true);
    const createdEvent = await createResponse.json();
    testEventIds.push(createdEvent.id);

    expect(createdEvent).toHaveProperty('rule_fields');
    expect(createdEvent.rule_fields.solar_term_name).toBe('冬至');
  });

  it('獲取事件列表應該使用 v2 格式', async () => {
    // 至少創建一個事件確保列表不為空
    if (testEventIds.length === 0) {
      const testEvent = {
        title: 'Test List Display',
        type: 'festival',
        description: 'Test event for list',
        solar_month: 1,
        solar_day: 1
      };

      const createResponse = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'api-version': 'v2'
        },
        body: JSON.stringify(testEvent)
      });

      if (createResponse.ok) {
        const created = await createResponse.json();
        testEventIds.push(created.id);
      }
    }

    // 測試列表 API
    const listResponse = await fetch(`${API_BASE_URL}/events`, {
      headers: { 'api-version': 'v2' }
    });

    expect(listResponse.ok).toBe(true);
    const listData = await listResponse.json();
    expect(listData).toHaveProperty('events');
    expect(Array.isArray(listData.events)).toBe(true);

    if (listData.events.length > 0) {
      const firstEvent = listData.events[0];
      // 驗證列表中的事件也有 v2 格式欄位
      expect(firstEvent).toHaveProperty('rule_fields');
    }
  });
});