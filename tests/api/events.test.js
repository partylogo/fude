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

  test('GET /api/events should filter events by date range', async () => {
    const response = await request(app)
      .get('/api/events?from=2025-04-01&to=2025-04-30')
      .expect(200);

    expect(response.body).toHaveProperty('events');
    
    // 應該只返回 4 月份的事件
    const events = response.body.events;
    events.forEach(event => {
      const eventDate = new Date(event.solar_date);
      expect(eventDate.getTime()).toBeGreaterThanOrEqual(new Date('2025-04-01').getTime());
      expect(eventDate.getTime()).toBeLessThanOrEqual(new Date('2025-04-30').getTime());
    });
  });

  test('GET /api/events should return empty array for no matching dates', async () => {
    const response = await request(app)
      .get('/api/events?from=2025-01-01&to=2025-01-31')
      .expect(200);

    expect(response.body).toHaveProperty('events');
    expect(response.body.events).toEqual([]);
  });

  test('GET /api/events should return all events when no date range provided', async () => {
    const response = await request(app)
      .get('/api/events')
      .expect(200);

    expect(response.body).toHaveProperty('events');
    expect(response.body.events.length).toBeGreaterThan(0);
  });
});