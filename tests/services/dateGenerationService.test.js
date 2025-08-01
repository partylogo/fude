// Date Generation Service Tests - TDD Recovery (Simplified)
// Following Kent Beck's TDD principles (Red → Green → Refactor)

const dateGenerationService = require('../../services/dateGenerationService');

// Mock the database query function
jest.mock('../../database/database', () => ({
  query: jest.fn()
}));

const { query } = require('../../database/database');

describe('DateGenerationService - Core Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXTEND_YEARS = '5';
    process.env.TZ = 'Asia/Taipei';
  });

  afterEach(() => {
    delete process.env.EXTEND_YEARS;
    delete process.env.TZ;
  });

  describe('Basic Error Handling', () => {
    test('should throw error when event not found', async () => {
      // Arrange (Red phase - test first)
      query.mockResolvedValueOnce({ rows: [] }); // getEvent returns empty

      // Act & Assert
      await expect(dateGenerationService.generateOccurrences(999))
        .rejects.toThrow('Event not found: 999');
    });

  });

  describe('Complex Date Rule Generation - TDD Core Features', () => {
    // RED: These tests should fail initially - we're following TDD
    
    test('should generate lunar event occurrences with leap month handling', async () => {
      // RED: This test defines the behavior we want to implement
      const mockEvent = {
        id: 1,
        title: '媽祖聖誕',
        type: 'deity',
        is_lunar: true,
        lunar_month: 3,
        lunar_day: 23,
        leap_behavior: 'both', // Both regular and leap month
        rule_version: 1
      };

      // Mock getEvent to return our test event
      query.mockResolvedValueOnce({ rows: [mockEvent] });
      
      // Mock lunar calendar service
      const mockLunarService = require('../../services/lunarCalendarService');
      mockLunarService.convertToSolar = jest.fn()
        .mockReturnValueOnce(['2025-04-20']) // Regular month
        .mockReturnValueOnce(['2025-05-19']); // Leap month

      // Mock successful occurrence insertion
      query.mockResolvedValueOnce({ rowCount: 2 }); // insertOccurrences
      query.mockResolvedValueOnce({ rowCount: 1 }); // updateEvent

      // Act
      const result = await dateGenerationService.generateOccurrences(1);

      // Assert - should generate occurrences for both regular and leap month
      expect(result.success).toBe(true);
      expect(result.occurrencesGenerated).toBeGreaterThanOrEqual(2);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO event_occurrences'),
        expect.any(Array)
      );
    });

    test('should generate solar term event occurrences from CWB data', async () => {
      // RED: This test defines solar term behavior - simplified version
      const mockEvent = {
        id: 2,
        title: '清明掃墓',
        type: 'solar_term',
        solar_term_name: '清明',
        rule_version: 1,
        generated_until: null // Generate from current year
      };

      // Mock getEvent
      query.mockResolvedValueOnce({ rows: [mockEvent] });
      
      // Mock getSolarTermDate calls - just mock the query directly
      query.mockImplementation((sql, params) => {
        if (sql.includes('SELECT occurrence_date FROM solar_terms')) {
          return Promise.resolve({ rows: [{ occurrence_date: '2025-04-05' }] });
        }
        if (sql.includes('SELECT COUNT(*) as count')) {
          return Promise.resolve({ rows: [{ count: 1 }] }); // Data exists
        }
        if (sql.includes('INSERT INTO event_occurrences')) {
          return Promise.resolve({ rowCount: 5 });
        }
        if (sql.includes('UPDATE events')) {
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rows: [] });
      });

      // Act
      const result = await dateGenerationService.generateOccurrences(2);

      // Assert - should generate from solar_terms table data
      expect(result.success).toBe(true);
      expect(result.occurrencesGenerated).toBeGreaterThan(0);
    });

    test('should handle generation errors and record them properly', async () => {
      // RED: This test defines error handling behavior
      const mockEvent = {
        id: 3,
        title: '測試事件',
        type: 'deity',
        is_lunar: true,
        lunar_month: 13, // Invalid month - should cause error
        lunar_day: 32,   // Invalid day - should cause error
        leap_behavior: 'never_leap',
        rule_version: 1
      };

      query.mockResolvedValueOnce({ rows: [mockEvent] });
      
      // Mock lunar conversion failure
      const mockLunarService = require('../../services/lunarCalendarService');
      mockLunarService.convertToSolar = jest.fn()
        .mockImplementation(() => {
          throw new Error('Invalid lunar date');
        });

      // Mock error insertion
      query.mockResolvedValueOnce({ rowCount: 1 }); // insertGenerationError

      // Act & Assert - should record error and not throw
      await expect(dateGenerationService.generateOccurrences(3))
        .rejects.toThrow('Invalid lunar date');
      
      // Should have attempted to record the error
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO generation_errors'),
        expect.arrayContaining([3, 'lunar_conversion', 'Invalid lunar date'])
      );
    });
  });

  describe('Helper Functions', () => {
    test('should insert error record with correct parameters', async () => {
      // Arrange
      const errorData = {
        event_id: 1,
        error_type: 'lunar_conversion',
        error_message: 'Invalid date',
        retryable: true,
        context_data: { year: 2025, month: 3, day: 23 }
      };

      query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      await dateGenerationService.insertGenerationError(errorData);

      // Assert
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO generation_errors'),
        [
          1,
          'lunar_conversion',
          'Invalid date',
          true,
          JSON.stringify(errorData.context_data)
        ]
      );
    });

    test('should get solar term date when data exists', async () => {
      // Arrange
      query.mockResolvedValueOnce({ 
        rows: [{ occurrence_date: '2025-04-05' }] 
      });

      // Act
      const result = await dateGenerationService.getSolarTermDate('清明', 2025);

      // Assert
      expect(result).toBe('2025-04-05');
    });
  });
});