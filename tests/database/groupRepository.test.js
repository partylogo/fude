const GroupRepository = require('../../database/groupRepository');

describe('GroupRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new GroupRepository();
  });

  describe('findAll', () => {
    test('should return all groups', async () => {
      const groups = await repository.findAll();
      
      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThan(0);
      
      // 檢查群組結構
      const group = groups[0];
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('description');
      expect(group).toHaveProperty('enabled');
    });

    test('should filter enabled groups only', async () => {
      const enabledGroups = await repository.findEnabledGroups();
      
      expect(Array.isArray(enabledGroups)).toBe(true);
      enabledGroups.forEach(group => {
        expect(group.enabled).toBe(true);
      });
    });
  });

  describe('findById', () => {
    test('should return group by id', async () => {
      const group = await repository.findById(1);
      
      expect(group).not.toBeNull();
      expect(group.id).toBe(1);
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('description');
    });

    test('should return null for non-existent id', async () => {
      const group = await repository.findById(9999);
      expect(group).toBeNull();
    });
  });

  describe('getGroupEvents', () => {
    test('should return events for group', async () => {
      const events = await repository.getGroupEvents(1);
      
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      
      // 檢查事件結構
      const event = events[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('title');
    });

    test('should return empty array for non-existent group', async () => {
      const events = await repository.getGroupEvents(9999);
      expect(events).toEqual([]);
    });

    test('should return events grouped by type', async () => {
      const groupedEvents = await repository.getGroupEventsByType(1);
      
      expect(groupedEvents).toHaveProperty('deities');
      expect(groupedEvents).toHaveProperty('festivals');
      expect(Array.isArray(groupedEvents.deities)).toBe(true);
      expect(Array.isArray(groupedEvents.festivals)).toBe(true);
    });
  });

  describe('create', () => {
    test('should create new group', async () => {
      const newGroup = {
        name: '測試群組',
        description: '測試描述',
        enabled: true,
        video_url: 'https://example.com/video'
      };

      const created = await repository.create(newGroup);
      
      expect(created).toHaveProperty('id');
      expect(created.name).toBe('測試群組');
      expect(created.enabled).toBe(true);
    });
  });

  describe('addEventToGroup', () => {
    test('should add event to group', async () => {
      const result = await repository.addEventToGroup(1, 2);
      expect(result).toBe(true);
      
      // 驗證事件已加入群組
      const events = await repository.getGroupEvents(1);
      const eventIds = events.map(e => e.id);
      expect(eventIds).toContain(2);
    });

    test('should handle non-existent group or event', async () => {
      const result = await repository.addEventToGroup(9999, 1);
      expect(result).toBe(false);
    });
  });
});