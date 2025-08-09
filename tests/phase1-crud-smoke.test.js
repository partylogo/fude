// Phase 1: 四類型 CRUD Smoke 測試
// 測試 deity, festival, custom, solar_term 的完整 CRUD 操作
// 確保資料正確寫入 Supabase 且返回格式正確

const request = require('supertest');
const app = require('../server');

describe('Phase 1 - 四類型 CRUD Smoke 測試', () => {
  let createdEventIds = [];

  // 清理函數
  const cleanup = async () => {
    for (const id of createdEventIds) {
      try {
        await request(app).delete(`/api/events/${id}`);
      } catch (e) {
        // 忽略清理錯誤
      }
    }
    createdEventIds = [];
  };

  afterEach(cleanup);
  afterAll(cleanup);

  // 測試 deity 類型 - 神明節日
  describe('Deity Events (神明節日)', () => {
    test('應該成功創建神明事件並返回正確格式', async () => {
      const deityEvent = {
        title: '媽祖聖誕',
        type: 'deity',
        description: '天后媽祖的誕辰紀念日',
        lunar_month: 3,
        lunar_day: 23,
        is_leap_month: false,
        leap_behavior: 'never_leap'
      };

      const response = await request(app)
        .post('/api/events')
        .send(deityEvent)
        .expect(201);

      expect(response.headers['x-data-source']).toBe('supabase');
      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe(deityEvent.title);
      expect(response.body.type).toBe('deity');
      expect(response.body.lunar_month).toBe(3);
      expect(response.body.lunar_day).toBe(23);
      expect(response.body.is_leap_month).toBe(false);
      expect(response.body.leap_behavior).toBe('never_leap');

      createdEventIds.push(response.body.id);
    });

    test('應該成功讀取、更新和刪除神明事件', async () => {
      // 創建
      const createResponse = await request(app)
        .post('/api/events')
        .send({
          title: '關聖帝君聖誕',
          type: 'deity', 
          description: '關公誕辰',
          lunar_month: 6,
          lunar_day: 24,
          is_leap_month: false,
          leap_behavior: 'both'
        })
        .expect(201);

      const eventId = createResponse.body.id;
      createdEventIds.push(eventId);

      // 讀取
      const getResponse = await request(app)
        .get(`/api/events/${eventId}`)
        .expect(200);

      expect(getResponse.headers['x-data-source']).toBe('supabase');
      expect(getResponse.body.title).toBe('關聖帝君聖誕');

      // 更新
      const updateResponse = await request(app)
        .put(`/api/events/${eventId}`)
        .send({
          title: '關聖帝君聖誕（更新）',
          leap_behavior: 'always_leap'
        })
        .expect(200);

      expect(updateResponse.headers['x-data-source']).toBe('supabase');
      expect(updateResponse.body.title).toBe('關聖帝君聖誕（更新）');
      expect(updateResponse.body.leap_behavior).toBe('always_leap');

      // 刪除
      await request(app)
        .delete(`/api/events/${eventId}`)
        .expect(200);

      // 驗證已刪除
      await request(app)
        .get(`/api/events/${eventId}`)
        .expect(404);
    });
  });

  // 測試 festival 類型 - 民俗節慶
  describe('Festival Events (民俗節慶)', () => {
    test('應該成功創建民俗節慶並返回正確格式', async () => {
      const festivalEvent = {
        title: '春節',
        type: 'festival',
        description: '農曆新年',
        solar_month: 2,
        solar_day: 10
      };

      const response = await request(app)
        .post('/api/events')
        .send(festivalEvent)
        .expect(201);

      expect(response.headers['x-data-source']).toBe('supabase');
      expect(response.body.title).toBe('春節');
      expect(response.body.type).toBe('festival');
      expect(response.body.solar_month).toBe(2);
      expect(response.body.solar_day).toBe(10);
      expect(response.body.solar_date).toMatch(/^\d{4}-02-10$/);

      createdEventIds.push(response.body.id);
    });
  });

  // 測試 custom 類型 - 自訂事件
  describe('Custom Events (自訂事件)', () => {
    test('應該成功創建自訂事件並返回正確格式', async () => {
      const customEvent = {
        title: '家庭聚會',
        type: 'custom',
        description: '年度家庭聚會',
        one_time_date: '2025-05-15'
      };

      const response = await request(app)
        .post('/api/events')
        .send(customEvent)
        .expect(201);

      expect(response.headers['x-data-source']).toBe('supabase');
      expect(response.body.title).toBe('家庭聚會');
      expect(response.body.type).toBe('custom');
      expect(response.body.one_time_date).toBe('2025-05-15');
      expect(response.body.solar_date).toBe('2025-05-15');

      createdEventIds.push(response.body.id);
    });
  });

  // 測試 solar_term 類型 - 節氣事件
  describe('Solar Term Events (節氣事件)', () => {
    test('應該成功創建節氣事件並返回正確格式', async () => {
      const solarTermEvent = {
        title: '清明祭祖',
        type: 'solar_term',
        description: '清明節祭祖活動',
        solar_term_name: '清明'
      };

      const response = await request(app)
        .post('/api/events')
        .send(solarTermEvent)
        .expect(201);

      expect(response.headers['x-data-source']).toBe('supabase');
      expect(response.body.title).toBe('清明祭祖');
      expect(response.body.type).toBe('solar_term');
      expect(response.body.solar_term_name).toBe('清明');
      // solar_date 應該為 null（待 occurrences 生成）
      expect(response.body.solar_date).toBeNull();

      createdEventIds.push(response.body.id);
    });
  });

  // 測試錯誤處理
  describe('Error Handling (錯誤處理)', () => {
    test('應該返回結構化的驗證錯誤', async () => {
      const invalidEvent = {
        title: '',  // 空標題
        type: 'deity',
        description: ''  // 空描述
      };

      const response = await request(app)
        .post('/api/events')
        .send(invalidEvent)
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('errors');
      expect(Array.isArray(response.body.details.errors)).toBe(true);
    });

    test('應該返回結構化的404錯誤', async () => {
      const response = await request(app)
        .get('/api/events/99999')
        .expect(404);

      expect(response.body).toHaveProperty('status', 404);
      expect(response.body).toHaveProperty('message', 'Event not found');
      expect(response.body).toHaveProperty('code', 'EVENT_NOT_FOUND');
    });

    test('應該返回結構化的更新404錯誤', async () => {
      const response = await request(app)
        .put('/api/events/99999')
        .send({ title: '測試' })
        .expect(404);

      expect(response.body).toHaveProperty('status', 404);
      expect(response.body).toHaveProperty('message', 'Event not found');
      expect(response.body).toHaveProperty('code', 'EVENT_NOT_FOUND');
    });

    test('應該返回結構化的刪除404錯誤', async () => {
      const response = await request(app)
        .delete('/api/events/99999')
        .expect(404);

      expect(response.body).toHaveProperty('status', 404);
      expect(response.body).toHaveProperty('message', 'Event not found');
      expect(response.body).toHaveProperty('code', 'EVENT_NOT_FOUND');
    });
  });

  // 測試資料來源標頭
  describe('Data Source Headers (資料來源標頭)', () => {
    test('所有操作都應該標記為 supabase 來源', async () => {
      // 創建事件
      const createResponse = await request(app)
        .post('/api/events')
        .send({
          title: '測試標頭',
          type: 'custom',
          description: '測試資料來源標頭',
          one_time_date: '2025-06-01'
        });
      
      expect(createResponse.headers['x-data-source']).toBe('supabase');
      const eventId = createResponse.body.id;
      createdEventIds.push(eventId);

      // 讀取事件
      const getResponse = await request(app).get(`/api/events/${eventId}`);
      expect(getResponse.headers['x-data-source']).toBe('supabase');

      // 更新事件
      const updateResponse = await request(app)
        .put(`/api/events/${eventId}`)
        .send({ title: '更新測試標頭' });
      expect(updateResponse.headers['x-data-source']).toBe('supabase');

      // 刪除事件
      const deleteResponse = await request(app).delete(`/api/events/${eventId}`);
      expect(deleteResponse.headers['x-data-source']).toBe('supabase');

      // 列表操作
      const listResponse = await request(app).get('/api/events');
      expect(listResponse.headers['x-data-source']).toBe('supabase');
    });
  });
});