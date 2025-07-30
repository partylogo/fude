const request = require('supertest');
const app = require('../../server');

describe('Lunar Calendar API', () => {
  test('POST /api/lunar should convert lunar date to solar dates', async () => {
    const lunarDate = {
      year: 2025,
      month: 3,
      day: 23,
      isLeap: false
    };

    const response = await request(app)
      .post('/api/lunar')
      .send({ lunar: lunarDate })
      .expect(200);

    expect(response.body).toHaveProperty('solar_dates');
    expect(Array.isArray(response.body.solar_dates)).toBe(true);
    expect(response.body.solar_dates.length).toBeGreaterThan(0);
  });

  test('POST /api/lunar should handle leap months', async () => {
    const leapLunarDate = {
      year: 2025,
      month: 3,
      day: 15,
      isLeap: true
    };

    const response = await request(app)
      .post('/api/lunar')
      .send({ lunar: leapLunarDate })
      .expect(200);

    expect(response.body).toHaveProperty('solar_dates');
    expect(response.body.solar_dates).toBeDefined();
  });

  test('POST /api/lunar should return validation error for invalid input', async () => {
    const invalidInput = {
      month: 13, // 無效月份
      day: 32    // 無效日期
    };

    const response = await request(app)
      .post('/api/lunar')
      .send({ lunar: invalidInput })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});