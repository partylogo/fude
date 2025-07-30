const LunarCalendarService = require('../../services/lunarCalendarService');

describe('LunarCalendarService', () => {
  describe('validateLunarDate', () => {
    test('should accept valid lunar date', () => {
      const validLunar = { month: 3, day: 23, year: 2025, isLeap: false };
      const result = LunarCalendarService.validateLunarDate(validLunar);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject null input', () => {
      const result = LunarCalendarService.validateLunarDate(null);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid lunar date input');
    });

    test('should reject missing month', () => {
      const invalidLunar = { day: 23 };
      const result = LunarCalendarService.validateLunarDate(invalidLunar);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Month and day are required');
    });

    test('should reject invalid month range', () => {
      const invalidLunar = { month: 13, day: 15 };
      const result = LunarCalendarService.validateLunarDate(invalidLunar);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Month must be between 1 and 12');
    });

    test('should reject invalid day range', () => {
      const invalidLunar = { month: 3, day: 31 };
      const result = LunarCalendarService.validateLunarDate(invalidLunar);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Day must be between 1 and 30');
    });
  });

  describe('convertToSolar', () => {
    test('should convert 媽祖聖誕 correctly', () => {
      const mazuBirthday = { month: 3, day: 23 };
      const result = LunarCalendarService.convertToSolar(mazuBirthday);
      
      expect(result).toEqual(['2025-04-20']);
    });

    test('should convert 農曆新年 correctly', () => {
      const newYear = { month: 1, day: 1 };
      const result = LunarCalendarService.convertToSolar(newYear);
      
      expect(result).toEqual(['2025-01-29']);
    });

    test('should handle unknown dates with simulation', () => {
      const unknownDate = { month: 6, day: 15 };
      const result = LunarCalendarService.convertToSolar(unknownDate);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });
  });

  describe('formatLunarDate', () => {
    test('should format regular lunar date', () => {
      const lunar = { month: 3, day: 23, isLeap: false };
      const result = LunarCalendarService.formatLunarDate(lunar);
      
      expect(result).toBe('農曆三月廿三');
    });

    test('should format leap month', () => {
      const leapLunar = { month: 3, day: 15, isLeap: true };
      const result = LunarCalendarService.formatLunarDate(leapLunar);
      
      expect(result).toBe('農曆閏三月十五');
    });

    test('should format first day correctly', () => {
      const firstDay = { month: 1, day: 1, isLeap: false };
      const result = LunarCalendarService.formatLunarDate(firstDay);
      
      expect(result).toBe('農曆正月初一');
    });
  });
});