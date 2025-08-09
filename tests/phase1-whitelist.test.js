// Phase 1: 白名單機制驗證測試
// 測試非法欄位是否正確返回 400 錯誤

const request = require('supertest');
const app = require('../server');

describe('Phase 1 - 白名單機制驗證', () => {
  const validEventBase = {
    title: '測試事件',
    type: 'custom',
    description: '測試描述',
    one_time_date: '2025-06-01'
  };

  describe('非法欄位驗證', () => {
    test('應該拒絕包含非法欄位的創建請求', async () => {
      const invalidEvent = {
        ...validEventBase,
        invalid_field: '這是非法欄位',
        another_bad_field: 123,
        malicious_data: { evil: true }
      };

      const response = await request(app)
        .post('/api/events')
        .send(invalidEvent)
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('code', 'E_INVALID_FIELDS');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('errors');
      expect(Array.isArray(response.body.details.errors)).toBe(true);
      
      const errorMessage = response.body.details.errors[0];
      expect(errorMessage).toContain('Invalid fields not allowed');
      expect(errorMessage).toContain('invalid_field');
      expect(errorMessage).toContain('another_bad_field');
      expect(errorMessage).toContain('malicious_data');
    });

    test('應該拒絕包含非法欄位的更新請求', async () => {
      // 先創建一個有效事件
      const createResponse = await request(app)
        .post('/api/events')
        .send(validEventBase)
        .expect(201);

      const eventId = createResponse.body.id;

      // 嘗試用非法欄位更新
      const invalidUpdate = {
        title: '更新後的標題',
        hacker_field: 'malicious_value',
        sql_injection: "'; DROP TABLE events; --"
      };

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('code', 'E_INVALID_FIELDS');
      
      const errorMessage = response.body.details.errors[0];
      expect(errorMessage).toContain('hacker_field');
      expect(errorMessage).toContain('sql_injection');

      // 清理
      await request(app).delete(`/api/events/${eventId}`);
    });

    test('應該允許只包含合法欄位的請求', async () => {
      const validEvent = {
        title: '完全合法的事件',
        type: 'deity',
        description: '只包含白名單欄位',
        is_lunar: true,
        lunar_month: 5,
        lunar_day: 15,
        is_leap_month: false,
        leap_behavior: 'never_leap',
        rule_version: 1
      };

      const response = await request(app)
        .post('/api/events')
        .send(validEvent)
        .expect(201);

      expect(response.body).toHaveProperty('title', validEvent.title);
      expect(response.body).toHaveProperty('type', validEvent.type);
      expect(response.body).toHaveProperty('lunar_month', validEvent.lunar_month);

      // 清理
      await request(app).delete(`/api/events/${response.body.id}`);
    });

    test('應該允許部分合法欄位的更新', async () => {
      // 創建事件
      const createResponse = await request(app)
        .post('/api/events')
        .send(validEventBase)
        .expect(201);

      const eventId = createResponse.body.id;

      // 用合法欄位更新
      const validUpdate = {
        title: '更新後的標題',
        description: '更新後的描述'
      };

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .send(validUpdate)
        .expect(200);

      expect(response.body).toHaveProperty('title', validUpdate.title);
      expect(response.body).toHaveProperty('description', validUpdate.description);

      // 清理
      await request(app).delete(`/api/events/${eventId}`);
    });
  });

  describe('邊界情況測試', () => {
    test('應該處理空物件', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({})
        .expect(400);

      // 應該是驗證錯誤而非白名單錯誤
      expect(response.body).toHaveProperty('code', 'E_EVENT_VALIDATION');
    });

    test('應該處理 null 值', async () => {
      const eventWithNulls = {
        title: '測試事件',
        type: 'custom',
        description: '測試描述',
        one_time_date: '2025-06-01',
        solar_date: null,
        rule_version: null
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventWithNulls)
        .expect(201);

      // 清理
      await request(app).delete(`/api/events/${response.body.id}`);
    });

    test('應該處理混合的合法和非法欄位', async () => {
      const mixedEvent = {
        // 合法欄位
        title: '混合測試',
        type: 'festival',
        description: '測試描述',
        solar_month: 5,
        solar_day: 20,
        
        // 非法欄位
        bad_field_1: 'should be rejected',
        bad_field_2: 42
      };

      const response = await request(app)
        .post('/api/events')
        .send(mixedEvent)
        .expect(400);

      expect(response.body).toHaveProperty('code', 'E_INVALID_FIELDS');
      
      const errorMessage = response.body.details.errors[0];
      expect(errorMessage).toContain('bad_field_1');
      expect(errorMessage).toContain('bad_field_2');
    });
  });

  describe('白名單完整性驗證', () => {
    const allowedFields = [
      'title', 'type', 'description', 'is_lunar', 'lunar_month', 'lunar_day', 
      'is_leap_month', 'leap_behavior', 'solar_month', 'solar_day', 
      'one_time_date', 'solar_term_name', 'solar_date', 'rule_version'
    ];

    test('所有白名單欄位都應該被接受', async () => {
      const allFieldsEvent = {};
      allowedFields.forEach(field => {
        switch (field) {
          case 'title':
            allFieldsEvent[field] = '測試標題';
            break;
          case 'type':
            allFieldsEvent[field] = 'custom';
            break;
          case 'description':
            allFieldsEvent[field] = '測試描述';
            break;
          case 'one_time_date':
            allFieldsEvent[field] = '2025-07-01';
            break;
          case 'is_lunar':
          case 'is_leap_month':
            allFieldsEvent[field] = false;
            break;
          case 'lunar_month':
          case 'lunar_day':
          case 'solar_month':
          case 'solar_day':
          case 'rule_version':
            allFieldsEvent[field] = 1;
            break;
          case 'leap_behavior':
            allFieldsEvent[field] = 'never_leap';
            break;
          case 'solar_term_name':
            allFieldsEvent[field] = '立春';
            break;
          case 'solar_date':
            allFieldsEvent[field] = ['2025-07-01'];
            break;
          default:
            allFieldsEvent[field] = null;
        }
      });

      const response = await request(app)
        .post('/api/events')
        .send(allFieldsEvent)
        .expect(201);

      expect(response.body).toHaveProperty('title', '測試標題');

      // 清理
      await request(app).delete(`/api/events/${response.body.id}`);
    });
  });
});