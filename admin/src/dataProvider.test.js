// Data Provider 測試 - 連接本地 API
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios - 必須在 import 之前
vi.mock('axios', () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  };
  
  return {
    default: {
      create: vi.fn(() => mockAxios)
    }
  };
});

import dataProvider from './dataProvider';

describe('DataProvider', () => {
  let mockAxios;

  beforeEach(async () => {
    vi.clearAllMocks();
    // 取得 mock 實例
    const axios = (await import('axios')).default;
    mockAxios = axios.create();
  });

  describe('events resource', () => {
    it('should get events list', async () => {
      const mockEvents = {
        data: {
          events: [
            { id: 1, title: '媽祖聖誕', type: 'deity' },
            { id: 2, title: '清明節', type: 'festival' }
          ]
        }
      };

      mockAxios.get.mockResolvedValue(mockEvents);

      const result = await dataProvider.getList('events', {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'id', order: 'ASC' },
        filter: {}
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe('媽祖聖誕');
      expect(result.total).toBe(2);
    });

    it('should get single event', async () => {
      const mockEvent = {
        data: { id: 1, title: '媽祖聖誕', type: 'deity' }
      };

      mockAxios.get.mockResolvedValue(mockEvent);

      const result = await dataProvider.getOne('events', { id: 1 });

      expect(result.data.id).toBe(1);
      expect(result.data.title).toBe('媽祖聖誕');
    });

    it('should create new event', async () => {
      const newEvent = { title: '新事件', type: 'custom' };
      const mockResponse = {
        data: { id: 3, ...newEvent }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await dataProvider.create('events', { data: newEvent });

      expect(result.data.id).toBe(3);
      expect(result.data.title).toBe('新事件');
    });

    it('should update event', async () => {
      const updateData = { title: '更新的事件' };
      const mockResponse = {
        data: { id: 1, title: '更新的事件', type: 'deity' }
      };

      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await dataProvider.update('events', { 
        id: 1, 
        data: updateData 
      });

      expect(result.data.title).toBe('更新的事件');
    });

    it('should delete event', async () => {
      const mockResponse = {
        data: { id: 1 }
      };

      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await dataProvider.delete('events', { id: 1 });

      expect(result.data.id).toBe(1);
    });
  });

  describe('groups resource', () => {
    it('should get groups list', async () => {
      const mockGroups = {
        data: {
          groups: [
            { id: 1, name: '簡少年老師推薦', enabled: true },
            { id: 2, name: '基礎民俗節慶', enabled: true }
          ]
        }
      };

      mockAxios.get.mockResolvedValue(mockGroups);

      const result = await dataProvider.getList('groups', {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'id', order: 'ASC' },
        filter: {}
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('簡少年老師推薦');
      expect(result.total).toBe(2);
    });
  });

  describe('API connection', () => {
    it('should connect to correct local API endpoint', () => {
      expect(dataProvider.apiUrl).toBe('http://localhost:3000/api');
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(dataProvider.getList('events', {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'id', order: 'ASC' },
        filter: {}
      })).rejects.toThrow('API Error');
    });
  });
});