const request = require('supertest');
const app = require('../../server');

describe('Groups API', () => {
  describe('GET /api/groups', () => {
    test('should return list of available groups', async () => {
      const response = await request(app)
        .get('/api/groups')
        .expect(200);

      expect(response.body).toHaveProperty('groups');
      expect(Array.isArray(response.body.groups)).toBe(true);
      expect(response.body.groups.length).toBeGreaterThan(0);

      // 檢查群組結構
      const group = response.body.groups[0];
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('description');
      expect(group).toHaveProperty('enabled');
    });

    test('should include teacher recommendation group', async () => {
      const response = await request(app)
        .get('/api/groups')
        .expect(200);

      const teacherGroup = response.body.groups.find(
        g => g.name.includes('簡少年老師')
      );
      
      expect(teacherGroup).toBeDefined();
      expect(teacherGroup.name).toBe('簡少年老師 2025 拜拜推薦');
      expect(teacherGroup.enabled).toBe(true);
    });
  });

  describe('GET /api/groups/:id', () => {
    test('should return group details by id', async () => {
      const response = await request(app)
        .get('/api/groups/1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('enabled');
      expect(response.body).toHaveProperty('video_url');
      expect(response.body).toHaveProperty('created_at');
    });

    test('should return 404 for non-existent group', async () => {
      const response = await request(app)
        .get('/api/groups/9999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Group not found');
    });
  });

  describe('GET /api/groups/:id/items', () => {
    test('should return group items grouped by type', async () => {
      const response = await request(app)
        .get('/api/groups/1/items')
        .expect(200);

      expect(response.body).toHaveProperty('deities');
      expect(response.body).toHaveProperty('festivals');
      expect(Array.isArray(response.body.deities)).toBe(true);
      expect(Array.isArray(response.body.festivals)).toBe(true);

      // 檢查事件結構
      if (response.body.deities.length > 0) {
        const deity = response.body.deities[0];
        expect(deity).toHaveProperty('id');
        expect(deity).toHaveProperty('title');
        expect(deity).toHaveProperty('type', 'deity');
        expect(deity).toHaveProperty('solar_date');
      }
    });

    test('should return 404 for non-existent group items', async () => {
      const response = await request(app)
        .get('/api/groups/9999/items')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Group not found');
    });

    test('should include teacher recommendation events', async () => {
      const response = await request(app)
        .get('/api/groups/1/items')
        .expect(200);

      const totalEvents = response.body.deities.length + response.body.festivals.length;
      expect(totalEvents).toBeGreaterThan(0);
      
      // 應該包含媽祖聖誕
      const mazuEvent = [...response.body.deities, ...response.body.festivals]
        .find(event => event.title.includes('媽祖'));
      expect(mazuEvent).toBeDefined();
    });
  });
});