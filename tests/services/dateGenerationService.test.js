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
      const mockDate = new Date('2025-04-05');
      query.mockResolvedValueOnce({ 
        rows: [{ occurrence_date: mockDate }] 
      });

      // Act
      const result = await dateGenerationService.getSolarTermDate('清明', 2025);

      // Assert
      expect(result).toBe('2025-04-05');
    });
  });
});