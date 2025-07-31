// Groups CRUD API 測試
const request = require('supertest');
const express = require('express');
const { groupsHandler, groupDetailHandler, groupItemsHandler, createGroup, updateGroup, deleteGroup, addGroupItem, removeGroupItem } = require('../../api/groups');

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

describe('Groups CRUD API', () => {
  describe('POST /api/groups', () => {
    it('should create new group', async () => {
      // 設置路由
      app.post('/api/groups', createGroup);

      const newGroup = {
        name: '新增測試群組',
        description: '這是一個測試群組',
        enabled: true,
        video_url: 'https://www.youtube.com/watch?v=test123'
      };

      const response = await request(app)
        .post('/api/groups')
        .send(newGroup)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newGroup.name);
      expect(response.body.description).toBe(newGroup.description);
      expect(response.body.enabled).toBe(newGroup.enabled);
    });

    it('should validate required fields', async () => {
      app.post('/api/groups', createGroup);

      const invalidGroup = {
        enabled: true,
        video_url: 'https://example.com'
      };

      const response = await request(app)
        .post('/api/groups')
        .send(invalidGroup)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    it('should set default enabled to true', async () => {
      app.post('/api/groups', createGroup);

      const newGroup = {
        name: '測試群組',
        description: '測試描述'
      };

      const response = await request(app)
        .post('/api/groups')
        .send(newGroup)
        .expect(201);

      expect(response.body.enabled).toBe(true);
    });
  });

  describe('PUT /api/groups/:id', () => {
    it('should update existing group', async () => {
      app.put('/api/groups/:id', updateGroup);

      const updateData = {
        name: '更新的群組名稱',
        description: '更新的群組描述'
      };

      const response = await request(app)
        .put('/api/groups/1')
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent group', async () => {
      app.put('/api/groups/:id', updateGroup);

      const updateData = {
        name: '更新的群組名稱'
      };

      const response = await request(app)
        .put('/api/groups/9999')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should validate update data', async () => {
      app.put('/api/groups/:id', updateGroup);

      const invalidUpdate = {
        name: '' // 空字串不合法
      };

      const response = await request(app)
        .put('/api/groups/1')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should delete existing group', async () => {
      app.delete('/api/groups/:id', deleteGroup);

      const response = await request(app)
        .delete('/api/groups/1')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');
    });

    it('should return 404 for non-existent group', async () => {
      app.delete('/api/groups/:id', deleteGroup);

      const response = await request(app)
        .delete('/api/groups/9999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/groups/:id/items', () => {
    it('should add event to group', async () => {
      app.post('/api/groups/:id/items', addGroupItem);

      const itemData = {
        event_id: 2
      };

      const response = await request(app)
        .post('/api/groups/1/items')
        .send(itemData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('added');
    });

    it('should validate event_id', async () => {
      app.post('/api/groups/:id/items', addGroupItem);

      const invalidData = {
        // 缺少 event_id
      };

      const response = await request(app)
        .post('/api/groups/1/items')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent group', async () => {
      app.post('/api/groups/:id/items', addGroupItem);

      const itemData = {
        event_id: 1
      };

      const response = await request(app)
        .post('/api/groups/9999/items')
        .send(itemData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/groups/:id/items/:eventId', () => {
    it('should remove event from group', async () => {
      app.delete('/api/groups/:id/items/:eventId', removeGroupItem);

      const response = await request(app)
        .delete('/api/groups/1/items/1')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('removed');
    });

    it('should return 404 for non-existent group', async () => {
      app.delete('/api/groups/:id/items/:eventId', removeGroupItem);

      const response = await request(app)
        .delete('/api/groups/9999/items/1')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent event in group', async () => {
      app.delete('/api/groups/:id/items/:eventId', removeGroupItem);

      const response = await request(app)
        .delete('/api/groups/1/items/9999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});