// System API Tests - TDD Recovery
// Following Kent Beck's TDD principles

const request = require('supertest');
const app = require('../../server');

// Mock the database query function
jest.mock('../../database/database', () => ({
  query: jest.fn()
}));

// Mock the dateGenerationService
jest.mock('../../services/dateGenerationService', () => ({
  annualMaintenanceJob: jest.fn(),
  generateOccurrences: jest.fn(),
  ensureSolarTermsData: jest.fn(),
  dailyOccurrenceGeneration: jest.fn()
}));

const { query } = require('../../database/database');
const dateGenerationService = require('../../services/dateGenerationService');

describe('System API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/system/extension-status', () => {
    test('should return extension status when data exists', async () => {
      // Arrange
      const mockStatus = {
        min_extended_year: 2025,
        max_extended_year: 2030,
        total_events: 10,
        events_need_extension: 2,
        target_extension_year: 2030
      };

      query.mockResolvedValueOnce({ rows: [mockStatus] });

      // Act
      const response = await request(app)
        .get('/api/system/extension-status');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);
    });

    test('should return default status when no data exists', async () => {
      // Arrange
      query.mockResolvedValueOnce({ rows: [] });

      // Act
      const response = await request(app)
        .get('/api/system/extension-status');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        min_extended_year: null,
        max_extended_year: null,
        total_events: 0,
        events_need_extension: 0,
        target_extension_year: expect.any(Number)
      });
    });

    test('should handle database error', async () => {
      // Arrange
      query.mockRejectedValueOnce(new Error('Database connection failed'));

      // Act
      const response = await request(app)
        .get('/api/system/extension-status');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/system/maintenance-history', () => {
    test('should return maintenance history with default limit', async () => {
      // Arrange
      const mockHistory = [
        {
          id: 1,
          maintenance_type: 'annual_extension',
          target_year: 2030,
          events_processed: 10,
          started_at: '2025-01-01T00:00:00Z',
          completed_at: '2025-01-01T00:05:00Z',
          status: 'completed'
        }
      ];

      query.mockResolvedValueOnce({ rows: mockHistory });

      // Act
      const response = await request(app)
        .get('/api/system/maintenance-history');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toEqual(mockHistory);
      expect(response.body.total).toBe(1);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1'),
        [10]
      );
    });

    test('should respect custom limit parameter', async () => {
      // Arrange
      query.mockResolvedValueOnce({ rows: [] });

      // Act
      const response = await request(app)
        .get('/api/system/maintenance-history?limit=5');

      // Assert
      expect(response.status).toBe(200);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1'),
        [5]
      );
    });
  });

  describe('POST /api/system/trigger-maintenance', () => {
    test('should trigger maintenance successfully', async () => {
      // Arrange
      const mockResult = {
        success: true,
        events_processed: 5,
        occurrences_created: 25,
        occurrences_deleted: 10
      };

      dateGenerationService.annualMaintenanceJob.mockResolvedValueOnce(mockResult);

      // Act
      const response = await request(app)
        .post('/api/system/trigger-maintenance');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('維護完成');
      expect(response.body.success).toBe(true);
      expect(response.body.events_processed).toBe(5);
    });

    test('should handle maintenance failure', async () => {
      // Arrange
      dateGenerationService.annualMaintenanceJob
        .mockRejectedValueOnce(new Error('Maintenance failed'));

      // Act
      const response = await request(app)
        .post('/api/system/trigger-maintenance');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('維護失敗');
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/system/generate-occurrences', () => {
    test('should generate occurrences for valid event ID', async () => {
      // Arrange
      dateGenerationService.generateOccurrences.mockResolvedValueOnce(10);

      // Act
      const response = await request(app)
        .post('/api/system/generate-occurrences')
        .send({ eventId: 1 });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('日期生成完成');
      expect(response.body.eventId).toBe(1);
      expect(response.body.generated_count).toBe(10);
      expect(response.body.success).toBe(true);
    });

    test('should return error for missing event ID', async () => {
      // Act
      const response = await request(app)
        .post('/api/system/generate-occurrences')
        .send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing eventId parameter');
    });

    test('should handle generation failure', async () => {
      // Arrange
      dateGenerationService.generateOccurrences
        .mockRejectedValueOnce(new Error('Event not found'));

      // Act
      const response = await request(app)
        .post('/api/system/generate-occurrences')
        .send({ eventId: 999 });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('日期生成失敗');
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/system/generation-errors', () => {
    test('should return generation errors with default filters', async () => {
      // Arrange
      const mockErrors = [
        {
          id: 1,
          event_id: 1,
          error_type: 'lunar_conversion',
          error_message: 'Invalid date',
          occurred_at: '2025-01-01T00:00:00Z',
          event_title: '媽祖聖誕'
        }
      ];

      query.mockResolvedValueOnce({ rows: mockErrors });

      // Act
      const response = await request(app)
        .get('/api/system/generation-errors');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.errors).toEqual(mockErrors);
      expect(response.body.total).toBe(1);
    });

    test('should filter by event ID when provided', async () => {
      // Arrange
      query.mockResolvedValueOnce({ rows: [] });

      // Act
      const response = await request(app)
        .get('/api/system/generation-errors?eventId=1');

      // Assert
      expect(response.status).toBe(200);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND ge.event_id = $1'),
        expect.arrayContaining(['1']) // eventId is parsed as string from query param
      );
    });

    test('should filter unresolved errors when requested', async () => {
      // Arrange
      query.mockResolvedValueOnce({ rows: [] });

      // Act
      const response = await request(app)
        .get('/api/system/generation-errors?unresolved=true');

      // Assert
      expect(response.status).toBe(200);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND ge.resolved_at IS NULL'),
        expect.any(Array)
      );
    });
  });

  describe('PUT /api/system/generation-errors/:id/resolve', () => {
    test('should resolve error successfully', async () => {
      // Arrange
      query.mockResolvedValueOnce({});

      // Act
      const response = await request(app)
        .put('/api/system/generation-errors/1/resolve');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('錯誤已標記為解決');
      expect(response.body.success).toBe(true);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE generation_errors'),
        ['1']
      );
    });

    test('should handle database error when resolving', async () => {
      // Arrange
      query.mockRejectedValueOnce(new Error('Database error'));

      // Act
      const response = await request(app)
        .put('/api/system/generation-errors/1/resolve');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('標記錯誤失敗');
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/solar-terms/:year', () => {
    test('should return solar terms for valid year', async () => {
      // Arrange
      const mockSolarTerms = [
        {
          term_name: '立春',
          occurrence_date: '2025-02-04',
          display_order: 1,
          season: '春'
        },
        {
          term_name: '雨水',
          occurrence_date: '2025-02-19',
          display_order: 2,
          season: '春'
        }
      ];

      dateGenerationService.ensureSolarTermsData.mockResolvedValueOnce();
      query.mockResolvedValueOnce({ rows: mockSolarTerms });

      // Act
      const response = await request(app)
        .get('/api/solar-terms/2025');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.year).toBe(2025);
      expect(response.body.solar_terms).toEqual(mockSolarTerms);
      expect(response.body.total).toBe(2);
      expect(dateGenerationService.ensureSolarTermsData).toHaveBeenCalledWith(2025);
    });

    test('should return error for invalid year', async () => {
      // Act
      const response = await request(app)
        .get('/api/solar-terms/abc');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid year parameter');
    });

    test('should return error for year out of range', async () => {
      // Act
      const response = await request(app)
        .get('/api/solar-terms/1800');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must be between 1900-2100');
    });

    test('should handle solar terms data error', async () => {
      // Arrange
      dateGenerationService.ensureSolarTermsData
        .mockRejectedValueOnce(new Error('Data import failed'));

      // Act
      const response = await request(app)
        .get('/api/solar-terms/2025');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/system/daily-cron', () => {
    test('should execute daily cron successfully', async () => {
      // Arrange
      const mockResult = {
        success: 5,
        failed: 0,
        errors: []
      };

      dateGenerationService.dailyOccurrenceGeneration.mockResolvedValueOnce(mockResult);

      // Act
      const response = await request(app)
        .post('/api/system/daily-cron');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('每日排程完成');
      expect(response.body.success).toBe(5); // success count from dailyOccurrenceGeneration result
      expect(response.body.failed).toBe(0);
      expect(response.body.errors).toEqual([]);
    });

    test('should handle daily cron failure', async () => {
      // Arrange
      dateGenerationService.dailyOccurrenceGeneration
        .mockRejectedValueOnce(new Error('Cron job failed'));

      // Act
      const response = await request(app)
        .post('/api/system/daily-cron');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('每日排程失敗');
      expect(response.body.success).toBe(false);
    });
  });
});