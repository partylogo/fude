const request = require('supertest');
const app = require('../../server');

// 這個測試會失敗，因為我們還沒有實作 API
describe('Events API', () => {
  test('GET /api/events should return events array', async () => {
    // 先用最簡單的測試 - 確保 endpoint 存在且回傳正確格式
    const response = await request(app)
      .get('/api/events')
      .expect(200);
    
    expect(response.body).toHaveProperty('events');
    expect(Array.isArray(response.body.events)).toBe(true);
  });
  
  test('GET /api/events should accept date range parameters', async () => {
    const response = await request(app)
      .get('/api/events?from=2025-01-01&to=2025-12-31')
      .expect(200);
    
    expect(response.body).toHaveProperty('events');
    expect(response.body.events.length).toBeGreaterThanOrEqual(0);
  });
});