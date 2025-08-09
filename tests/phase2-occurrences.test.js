// Phase 2: Event Occurrences 系統測試
// 測試 occurrence 生成、v1/v2 API 輸出格式、自動處理

const request = require('supertest');
const app = require('../server');
const OccurrenceGenerationService = require('../services/occurrenceGenerationService');

describe('Phase 2 - Event Occurrences 系統', () => {
  let createdEventIds = [];
  let occurrenceService;

  beforeAll(async () => {
    occurrenceService = new OccurrenceGenerationService();
  });

  // 清理函數
  const cleanup = async () => {
    for (const id of createdEventIds) {
      try {
        await occurrenceService.clearOccurrences(id);
        await request(app).delete(`/api/events/${id}`);
      } catch (e) {
        // 忽略清理錯誤
      }
    }
    createdEventIds = [];
  };

  afterEach(cleanup);
  afterAll(cleanup);

  // 測試 festival 類型 occurrences 生成
  describe('Festival Event Occurrences (民俗節慶)', () => {
    test('應該自動生成 festival 事件的 occurrences', async () => {
      const festivalEvent = {
        title: '中秋節',
        type: 'festival', 
        description: '中秋月圓人團圓',
        solar_month: 9,
        solar_day: 15
      };

      const response = await request(app)
        .post('/api/events')
        .send(festivalEvent)
        .expect(201);

      const eventId = response.body.id;
      createdEventIds.push(eventId);

      // 驗證 occurrences 已生成
      const currentYear = new Date().getFullYear();
      const occurrences = await occurrenceService.getOccurrencesByYear(eventId, currentYear);
      
      expect(occurrences).toBeDefined();
      expect(occurrences.length).toBeGreaterThan(0);
      expect(occurrences[0].occurrence_date).toMatch(new RegExp(`${currentYear}-09-15`));
      expect(occurrences[0].is_leap_month).toBe(false);
    });

    test('應該生成 5 年的 festival occurrences', async () => {
      const festivalEvent = {
        title: '春節',
        type: 'festival',
        description: '農曆新年',
        solar_month: 1,
        solar_day: 1
      };

      const createResponse = await request(app)
        .post('/api/events')
        .send(festivalEvent)
        .expect(201);

      const eventId = createResponse.body.id;
      createdEventIds.push(eventId);

      // 檢查是否生成了 5 年的 occurrences
      const currentYear = new Date().getFullYear();
      const endYear = currentYear + 5;
      
      for (let year = currentYear; year <= endYear; year++) {
        const yearOccurrences = await occurrenceService.getOccurrencesByYear(eventId, year);
        expect(yearOccurrences.length).toBe(1);
        expect(yearOccurrences[0].occurrence_date).toBe(`${year}-01-01`);
      }
    });
  });

  // 測試 custom 類型 occurrences 生成
  describe('Custom Event Occurrences (自訂事件)', () => {
    test('應該生成一次性 custom 事件的 occurrence', async () => {
      const customEvent = {
        title: '公司尾牙',
        type: 'custom',
        description: '年度尾牙活動',
        one_time_date: '2025-12-20'
      };

      const response = await request(app)
        .post('/api/events')
        .send(customEvent)
        .expect(201);

      const eventId = response.body.id;
      createdEventIds.push(eventId);

      // 驗證只生成一個 occurrence
      const occurrences = await occurrenceService.getOccurrencesByYear(eventId, 2025);
      
      expect(occurrences.length).toBe(1);
      expect(occurrences[0].occurrence_date).toBe('2025-12-20');
      expect(occurrences[0].is_leap_month).toBe(false);

      // 檢查其他年份沒有 occurrences
      const otherYearOccurrences = await occurrenceService.getOccurrencesByYear(eventId, 2026);
      expect(otherYearOccurrences.length).toBe(0);
    });
  });

  // 測試 v1 API 輸出格式
  describe('v1 API 輸出格式（相容性）', () => {
    test('v1 應該返回 solar_date 字串格式', async () => {
      const festivalEvent = {
        title: '元宵節',
        type: 'festival',
        description: '賞花燈猜燈謎',
        solar_month: 2,
        solar_day: 14
      };

      const createResponse = await request(app)
        .post('/api/events')
        .set('API-Version', 'v1')
        .send(festivalEvent)
        .expect(201);

      const eventId = createResponse.body.id;
      createdEventIds.push(eventId);

      // 檢查 v1 輸出格式
      expect(createResponse.body).toHaveProperty('solar_date');
      expect(typeof createResponse.body.solar_date).toBe('string');
      expect(createResponse.body.solar_date).toMatch(/^\d{4}-02-14$/);
      
      // v1 不應該有 next_occurrence_date
      expect(createResponse.body).not.toHaveProperty('next_occurrence_date');
      expect(createResponse.body).not.toHaveProperty('rule_fields');

      // 測試 GET endpoint
      const getResponse = await request(app)
        .get(`/api/events/${eventId}`)
        .set('API-Version', 'v1')
        .expect(200);

      expect(typeof getResponse.body.solar_date).toBe('string');
      expect(getResponse.body).not.toHaveProperty('next_occurrence_date');
    });
  });

  // 測試 v2 API 輸出格式
  describe('v2 API 輸出格式（新版）', () => {
    test('v2 應該返回 next_occurrence_date 和 rule_fields', async () => {
      const festivalEvent = {
        title: '端午節',
        type: 'festival',
        description: '包粽子划龍舟',
        solar_month: 6,
        solar_day: 10
      };

      const createResponse = await request(app)
        .post('/api/events')
        .set('API-Version', 'v2')
        .send(festivalEvent)
        .expect(201);

      const eventId = createResponse.body.id;
      createdEventIds.push(eventId);

      // 檢查 v2 輸出格式
      expect(createResponse.body).toHaveProperty('next_occurrence_date');
      expect(createResponse.body).toHaveProperty('rule_fields');
      
      expect(createResponse.body.rule_fields).toHaveProperty('solar_month', 6);
      expect(createResponse.body.rule_fields).toHaveProperty('solar_day', 10);
      expect(createResponse.body.rule_fields).toHaveProperty('is_lunar');

      // 測試 GET endpoint
      const getResponse = await request(app)
        .get(`/api/events/${eventId}`)
        .set('API-Version', 'v2')
        .expect(200);

      expect(getResponse.body).toHaveProperty('next_occurrence_date');
      expect(getResponse.body.next_occurrence_date).toMatch(/^\d{4}-06-10$/);
      expect(getResponse.body).toHaveProperty('rule_fields');
    });

    test('v2 列表 API 不應該包含 next_occurrence_date（效能考量）', async () => {
      const festivalEvent = {
        title: '國慶日',
        type: 'festival',
        description: '國家慶典',
        solar_month: 10,
        solar_day: 10
      };

      const createResponse = await request(app)
        .post('/api/events')
        .send(festivalEvent)
        .expect(201);

      createdEventIds.push(createResponse.body.id);

      // 測試列表 endpoint
      const listResponse = await request(app)
        .get('/api/events')
        .set('API-Version', 'v2')
        .expect(200);

      expect(listResponse.body.events).toBeDefined();
      expect(Array.isArray(listResponse.body.events)).toBe(true);
      
      if (listResponse.body.events.length > 0) {
        const event = listResponse.body.events.find(e => e.title === '國慶日');
        if (event) {
          // 列表中不包含 next_occurrence_date（效能考量）
          expect(event).not.toHaveProperty('next_occurrence_date');
        }
      }
    });
  });

  // 測試事件更新時重新生成 occurrences
  describe('事件更新自動處理', () => {
    test('更新 festival 規則欄位應該重新生成 occurrences', async () => {
      const festivalEvent = {
        title: '測試節慶',
        type: 'festival',
        description: '測試描述',
        solar_month: 5,
        solar_day: 20
      };

      const createResponse = await request(app)
        .post('/api/events')
        .send(festivalEvent)
        .expect(201);

      const eventId = createResponse.body.id;
      createdEventIds.push(eventId);

      // 檢查原始 occurrences
      const currentYear = new Date().getFullYear();
      const originalOccurrences = await occurrenceService.getOccurrencesByYear(eventId, currentYear);
      expect(originalOccurrences[0].occurrence_date).toBe(`${currentYear}-05-20`);

      // 更新規則欄位
      await request(app)
        .put(`/api/events/${eventId}`)
        .send({
          solar_month: 6,
          solar_day: 25
        })
        .expect(200);

      // 等待一下讓異步生成完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 檢查更新後的 occurrences
      const updatedOccurrences = await occurrenceService.getOccurrencesByYear(eventId, currentYear);
      expect(updatedOccurrences[0].occurrence_date).toBe(`${currentYear}-06-25`);
    });
  });

  // 測試事件刪除清理 occurrences
  describe('事件刪除自動清理', () => {
    test('刪除事件應該清理相關 occurrences', async () => {
      const festivalEvent = {
        title: '待刪除節慶',
        type: 'festival',
        description: '這個事件會被刪除',
        solar_month: 7,
        solar_day: 15
      };

      const createResponse = await request(app)
        .post('/api/events')
        .send(festivalEvent)
        .expect(201);

      const eventId = createResponse.body.id;

      // 確認 occurrences 已生成
      const currentYear = new Date().getFullYear();
      const occurrences = await occurrenceService.getOccurrencesByYear(eventId, currentYear);
      expect(occurrences.length).toBeGreaterThan(0);

      // 刪除事件
      await request(app)
        .delete(`/api/events/${eventId}`)
        .expect(200);

      // 等待一下讓異步清理完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 確認 occurrences 已清理
      const remainingOccurrences = await occurrenceService.getOccurrencesByYear(eventId, currentYear);
      expect(remainingOccurrences.length).toBe(0);
    });
  });

  // 測試不支援的事件類型
  describe('不支援事件類型處理', () => {
    test('solar_term 和 deity 類型不應該生成 occurrences（Phase 2）', async () => {
      const solarTermEvent = {
        title: '立夏',
        type: 'solar_term',
        description: '夏季開始',
        solar_term_name: '立夏'
      };

      const createResponse = await request(app)
        .post('/api/events')
        .send(solarTermEvent)
        .expect(201);

      const eventId = createResponse.body.id;
      createdEventIds.push(eventId);

      // 確認沒有生成 occurrences
      const currentYear = new Date().getFullYear();
      const occurrences = await occurrenceService.getOccurrencesByYear(eventId, currentYear);
      expect(occurrences.length).toBe(0);
    });
  });

  // 測試錯誤處理
  describe('錯誤處理', () => {
    test('invalid 日期應該被妥善處理', async () => {
      const invalidEvent = {
        title: '無效日期事件',
        type: 'festival',
        description: '測試無效日期',
        solar_month: 2,
        solar_day: 30 // 2月沒有30日
      };

      // 事件創建應該成功（由前端驗證負責）
      const response = await request(app)
        .post('/api/events')
        .send(invalidEvent)
        .expect(201);

      createdEventIds.push(response.body.id);

      // 但 occurrences 生成可能會有問題，應該被妥善處理
      // 系統不應該崩潰
    });
  });
});