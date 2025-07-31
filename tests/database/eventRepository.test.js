const EventRepository = require('../../database/eventRepository');

describe('EventRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new EventRepository();
  });

  describe('findAll', () => {
    test('should return all events', async () => {
      const events = await repository.findAll();
      
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      
      // 檢查事件結構
      const event = events[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('description');
      expect(event).toHaveProperty('solar_date');
    });

    test('should filter events by date range', async () => {
      const events = await repository.findByDateRange('2025-04-01', '2025-04-30');
      
      events.forEach(event => {
        const eventDate = new Date(Array.isArray(event.solar_date) ? event.solar_date[0] : event.solar_date);
        expect(eventDate.getTime()).toBeGreaterThanOrEqual(new Date('2025-04-01').getTime());
        expect(eventDate.getTime()).toBeLessThanOrEqual(new Date('2025-04-30').getTime());
      });
    });

    test('should filter events by type', async () => {
      const deityEvents = await repository.findByType('deity');
      
      expect(Array.isArray(deityEvents)).toBe(true);
      deityEvents.forEach(event => {
        expect(event.type).toBe('deity');
      });
    });
  });

  describe('findById', () => {
    test('should return event by id', async () => {
      const event = await repository.findById(1);
      
      expect(event).not.toBeNull();
      expect(event.id).toBe(1);
      expect(event).toHaveProperty('title');
    });

    test('should return null for non-existent id', async () => {
      const event = await repository.findById(9999);
      expect(event).toBeNull();
    });
  });

  describe('create', () => {
    test('should create new event', async () => {
      const newEvent = {
        type: 'custom',
        title: '測試事件',
        description: '測試描述',
        solar_date: ['2025-05-01'],
        lunar_month: 4,
        lunar_day: 1
      };

      const created = await repository.create(newEvent);
      
      expect(created).toHaveProperty('id');
      expect(created.title).toBe('測試事件');
      expect(created.type).toBe('custom');
    });
  });
});