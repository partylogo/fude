// Events CRUD API 測試
const request = require('supertest');
const express = require('express');
const eventsHandler = require('../../api/events');

// 創建 Express 應用用於測試
const app = express();
app.use(express.json());

// Mock console.error
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Events CRUD API', () => {
  describe('POST /api/events', () => {
    it('should create new event', async () => {
      // 設置路由
      app.post('/api/events', eventsHandler.createEvent);

      const newEvent = {
        title: '新增測試事件',
        type: 'custom',
        description: '這是一個測試事件',
        solar_date: '2025-05-01',
        lunar_month: 4,
        lunar_day: 1,
        is_leap_month: false
      };

      const response = await request(app)
        .post('/api/events')
        .send(newEvent)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newEvent.title);
      expect(response.body.type).toBe(newEvent.type);
      expect(response.body.description).toBe(newEvent.description);
    });

    it('should validate required fields', async () => {
      app.post('/api/events', eventsHandler.createEvent);

      const invalidEvent = {
        type: 'custom',
        description: '缺少標題的事件'
      };

      const response = await request(app)
        .post('/api/events')
        .send(invalidEvent)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    it('should validate event type', async () => {
      app.post('/api/events', eventsHandler.createEvent);

      const invalidEvent = {
        title: '無效類型事件',
        type: 'invalid_type',
        description: '事件描述'
      };

      const response = await request(app)
        .post('/api/events')
        .send(invalidEvent)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('type');
    });

    it('should validate lunar date range', async () => {
      app.post('/api/events', eventsHandler.createEvent);

      const invalidEvent = {
        title: '無效農曆日期',
        type: 'custom',
        description: '事件描述',
        lunar_month: 13, // 無效月份
        lunar_day: 1
      };

      const response = await request(app)
        .post('/api/events')
        .send(invalidEvent)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('lunar_month');
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update existing event', async () => {
      app.put('/api/events/:id', eventsHandler.updateEvent);

      const updateData = {
        title: '更新的事件標題',
        description: '更新的事件描述'
      };

      const response = await request(app)
        .put('/api/events/1')
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent event', async () => {
      app.put('/api/events/:id', eventsHandler.updateEvent);

      const updateData = {
        title: '更新的事件標題'
      };

      const response = await request(app)
        .put('/api/events/9999')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should validate update data', async () => {
      app.put('/api/events/:id', eventsHandler.updateEvent);

      const invalidUpdate = {
        type: 'invalid_type'
      };

      const response = await request(app)
        .put('/api/events/1')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete existing event', async () => {
      app.delete('/api/events/:id', eventsHandler.deleteEvent);

      const response = await request(app)
        .delete('/api/events/1')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');
    });

    it('should return 404 for non-existent event', async () => {
      app.delete('/api/events/:id', eventsHandler.deleteEvent);

      const response = await request(app)
        .delete('/api/events/9999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/events/:id', () => {
    it('should get single event', async () => {
      app.get('/api/events/:id', eventsHandler.getEvent);

      const response = await request(app)
        .get('/api/events/1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('type');
    });

    it('should return 404 for non-existent event', async () => {
      app.get('/api/events/:id', eventsHandler.getEvent);

      const response = await request(app)
        .get('/api/events/9999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });
});