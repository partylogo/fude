const GroupsService = require('../../services/groupsService');

describe('GroupsService', () => {
  const mockGroups = [
    {
      id: 1,
      name: '簡少年老師 2025 拜拜推薦',
      description: '精選推薦',
      enabled: true
    },
    {
      id: 2,
      name: '基礎民俗節慶',
      description: '基礎清單',
      enabled: true
    },
    {
      id: 3,
      name: '已停用群組',
      description: '測試用',
      enabled: false
    }
  ];

  const mockEvents = [
    { id: 1, type: 'deity', title: '媽祖聖誕' },
    { id: 2, type: 'festival', title: '清明節' },
    { id: 3, type: 'deity', title: '關帝聖誕' },
    { id: 4, type: 'custom', title: '自定事件' }
  ];

  const mockGroupItems = {
    1: [1, 2], // 群組1包含事件1,2
    2: [2, 3]  // 群組2包含事件2,3
  };

  describe('getAllGroups', () => {
    test('should return only enabled groups', () => {
      const result = GroupsService.getAllGroups(mockGroups);
      
      expect(result).toHaveLength(2);
      expect(result.every(group => group.enabled)).toBe(true);
      expect(result.map(g => g.id)).toEqual([1, 2]);
    });

    test('should handle empty array', () => {
      const result = GroupsService.getAllGroups([]);
      expect(result).toEqual([]);
    });

    test('should handle all disabled groups', () => {
      const disabledGroups = mockGroups.map(g => ({ ...g, enabled: false }));
      const result = GroupsService.getAllGroups(disabledGroups);
      expect(result).toEqual([]);
    });
  });

  describe('getGroupById', () => {
    test('should return group by valid id', () => {
      const result = GroupsService.getGroupById(mockGroups, 1);
      
      expect(result).not.toBeNull();
      expect(result.id).toBe(1);
      expect(result.name).toBe('簡少年老師 2025 拜拜推薦');
    });

    test('should return null for non-existent id', () => {
      const result = GroupsService.getGroupById(mockGroups, 9999);
      expect(result).toBeNull();
    });

    test('should return disabled group if it exists', () => {
      const result = GroupsService.getGroupById(mockGroups, 3);
      
      expect(result).not.toBeNull();
      expect(result.enabled).toBe(false);
    });

    test('should handle empty groups array', () => {
      const result = GroupsService.getGroupById([], 1);
      expect(result).toBeNull();
    });
  });

  describe('getGroupEvents', () => {
    test('should return events for valid group', () => {
      const result = GroupsService.getGroupEvents(1, mockGroupItems, mockEvents);
      
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toEqual([1, 2]);
      expect(result.map(e => e.title)).toEqual(['媽祖聖誕', '清明節']);
    });

    test('should return empty array for non-existent group', () => {
      const result = GroupsService.getGroupEvents(9999, mockGroupItems, mockEvents);
      expect(result).toEqual([]);
    });

    test('should handle group with no events', () => {
      const emptyGroupItems = { 1: [] };
      const result = GroupsService.getGroupEvents(1, emptyGroupItems, mockEvents);
      expect(result).toEqual([]);
    });

    test('should filter out non-existent event ids', () => {
      const invalidGroupItems = { 1: [1, 9999] }; // 事件 9999 不存在
      const result = GroupsService.getGroupEvents(1, invalidGroupItems, mockEvents);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('groupEventsByType', () => {
    test('should group events by type correctly', () => {
      const result = GroupsService.groupEventsByType(mockEvents);
      
      expect(result).toHaveProperty('deities');
      expect(result).toHaveProperty('festivals');
      expect(result.deities).toHaveLength(2);
      expect(result.festivals).toHaveLength(1);
      
      expect(result.deities.map(e => e.title)).toEqual(['媽祖聖誕', '關帝聖誕']);
      expect(result.festivals[0].title).toBe('清明節');
    });

    test('should handle empty events array', () => {
      const result = GroupsService.groupEventsByType([]);
      
      expect(result.deities).toEqual([]);
      expect(result.festivals).toEqual([]);
    });

    test('should handle events with only one type', () => {
      const deityOnlyEvents = mockEvents.filter(e => e.type === 'deity');
      const result = GroupsService.groupEventsByType(deityOnlyEvents);
      
      expect(result.deities).toHaveLength(2);
      expect(result.festivals).toEqual([]);
    });

    test('should ignore custom type events', () => {
      const result = GroupsService.groupEventsByType(mockEvents);
      
      // custom 事件不應該出現在結果中
      const allGroupedEvents = [...result.deities, ...result.festivals];
      expect(allGroupedEvents.every(e => e.type !== 'custom')).toBe(true);
    });
  });

  describe('validateGroupId', () => {
    test('should accept valid positive integer', () => {
      const result = GroupsService.validateGroupId('123');
      
      expect(result.isValid).toBe(true);
      expect(result.id).toBe(123);
    });

    test('should accept valid integer as number', () => {
      const result = GroupsService.validateGroupId(456);
      
      expect(result.isValid).toBe(true);
      expect(result.id).toBe(456);
    });

    test('should reject non-numeric strings', () => {
      const result = GroupsService.validateGroupId('abc');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid group ID');
    });

    test('should reject negative numbers', () => {
      const result = GroupsService.validateGroupId('-5');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid group ID');
    });

    test('should reject zero', () => {
      const result = GroupsService.validateGroupId('0');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid group ID');
    });

    test('should reject null or undefined', () => {
      expect(GroupsService.validateGroupId(null).isValid).toBe(false);
      expect(GroupsService.validateGroupId(undefined).isValid).toBe(false);
    });
  });

  describe('getGroupStats', () => {
    test('should calculate stats correctly', () => {
      const result = GroupsService.getGroupStats(mockEvents);
      
      expect(result.total).toBe(4);
      expect(result.deities).toBe(2);
      expect(result.festivals).toBe(1);
      expect(result.custom).toBe(1);
    });

    test('should handle empty events array', () => {
      const result = GroupsService.getGroupStats([]);
      
      expect(result.total).toBe(0);
      expect(result.deities).toBe(0);
      expect(result.festivals).toBe(0);
      expect(result.custom).toBe(0);
    });

    test('should handle single type events', () => {
      const deityOnlyEvents = mockEvents.filter(e => e.type === 'deity');
      const result = GroupsService.getGroupStats(deityOnlyEvents);
      
      expect(result.total).toBe(2);
      expect(result.deities).toBe(2);
      expect(result.festivals).toBe(0);
      expect(result.custom).toBe(0);
    });
  });
});