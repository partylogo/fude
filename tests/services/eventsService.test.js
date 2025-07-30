const EventsService = require('../../services/eventsService');

describe('EventsService', () => {
  const mockEvents = [
    {
      id: 1,
      type: 'deity',
      title: '媽祖聖誕',
      solar_date: '2025-04-20'
    },
    {
      id: 2,
      type: 'festival',
      title: '清明節',
      solar_date: '2025-04-05'
    },
    {
      id: 3,
      type: 'deity',
      title: '關帝聖誕',
      solar_date: '2025-07-23'
    }
  ];

  describe('filterByDateRange', () => {
    test('should return all events when no date range provided', () => {
      const result = EventsService.filterByDateRange(mockEvents, null, null);
      expect(result).toEqual(mockEvents);
    });

    test('should filter events by from date', () => {
      const result = EventsService.filterByDateRange(mockEvents, '2025-04-10', null);
      expect(result).toHaveLength(2); // 媽祖聖誕 + 關帝聖誕
      expect(result.map(e => e.title)).toEqual(['媽祖聖誕', '關帝聖誕']);
    });

    test('should filter events by to date', () => {
      const result = EventsService.filterByDateRange(mockEvents, null, '2025-04-30');
      expect(result).toHaveLength(2);
      expect(result.map(e => e.title)).toEqual(['媽祖聖誕', '清明節']);
    });

    test('should filter events by date range', () => {
      const result = EventsService.filterByDateRange(mockEvents, '2025-04-01', '2025-04-30');
      expect(result).toHaveLength(2);
      expect(result.map(e => e.title)).toEqual(['媽祖聖誕', '清明節']);
    });

    test('should return empty array for no matching dates', () => {
      const result = EventsService.filterByDateRange(mockEvents, '2025-01-01', '2025-01-31');
      expect(result).toEqual([]);
    });

    test('should handle exact date match', () => {
      const result = EventsService.filterByDateRange(mockEvents, '2025-04-20', '2025-04-20');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('媽祖聖誕');
    });
  });

  describe('isValidDateString', () => {
    test('should accept valid date format', () => {
      expect(EventsService.isValidDateString('2025-04-20')).toBe(true);
      expect(EventsService.isValidDateString('2025-01-01')).toBe(true);
      expect(EventsService.isValidDateString('2025-12-31')).toBe(true);
    });

    test('should accept null or undefined as valid', () => {
      expect(EventsService.isValidDateString(null)).toBe(true);
      expect(EventsService.isValidDateString(undefined)).toBe(true);
      expect(EventsService.isValidDateString('')).toBe(true);
    });

    test('should reject invalid date format', () => {
      expect(EventsService.isValidDateString('2025/04/20')).toBe(false);
      expect(EventsService.isValidDateString('20-04-2025')).toBe(false);
      expect(EventsService.isValidDateString('2025-4-20')).toBe(false);
      expect(EventsService.isValidDateString('invalid')).toBe(false);
    });

    test('should reject invalid date values', () => {
      expect(EventsService.isValidDateString('2025-13-01')).toBe(false);
      expect(EventsService.isValidDateString('2025-02-30')).toBe(false);
      expect(EventsService.isValidDateString('2025-00-01')).toBe(false);
    });
  });

  describe('groupByType', () => {
    test('should group events by type', () => {
      const result = EventsService.groupByType(mockEvents);
      
      expect(result).toHaveProperty('deity');
      expect(result).toHaveProperty('festival');
      expect(result.deity).toHaveLength(2);
      expect(result.festival).toHaveLength(1);
      
      expect(result.deity.map(e => e.title)).toEqual(['媽祖聖誕', '關帝聖誕']);
      expect(result.festival[0].title).toBe('清明節');
    });

    test('should handle empty array', () => {
      const result = EventsService.groupByType([]);
      expect(result).toEqual({});
    });

    test('should handle single type', () => {
      const singleTypeEvents = [mockEvents[0]];
      const result = EventsService.groupByType(singleTypeEvents);
      
      expect(Object.keys(result)).toEqual(['deity']);
      expect(result.deity).toHaveLength(1);
    });
  });
});