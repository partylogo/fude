// Solar Terms Constants Tests - TDD Recovery
// Following Kent Beck's TDD principles

const {
  SOLAR_TERMS,
  getSolarTermChoices,
  getSolarTermsBySeason,
  getSolarTermByName,
  isValidSolarTerm,
  getAllSolarTermNames
} = require('../../constants/solarTerms');

describe('Solar Terms Constants', () => {
  
  describe('SOLAR_TERMS data structure', () => {
    test('should contain exactly 24 solar terms', () => {
      // Act & Assert
      expect(SOLAR_TERMS).toHaveLength(24);
    });

    test('should have correct structure for each solar term', () => {
      // Act & Assert
      SOLAR_TERMS.forEach(term => {
        expect(term).toHaveProperty('name');
        expect(term).toHaveProperty('order');
        expect(term).toHaveProperty('season');
        expect(term).toHaveProperty('description');
        expect(typeof term.name).toBe('string');
        expect(typeof term.order).toBe('number');
        expect(['春', '夏', '秋', '冬']).toContain(term.season);
      });
    });

    test('should have sequential order from 1 to 24', () => {
      // Act
      const orders = SOLAR_TERMS.map(term => term.order).sort((a, b) => a - b);
      const expectedOrders = Array.from({ length: 24 }, (_, i) => i + 1);

      // Assert
      expect(orders).toEqual(expectedOrders);
    });

    test('should have equal distribution of seasons', () => {
      // Arrange
      const seasonCounts = { '春': 0, '夏': 0, '秋': 0, '冬': 0 };
      
      // Act
      SOLAR_TERMS.forEach(term => {
        seasonCounts[term.season]++;
      });

      // Assert - Each season should have 6 solar terms
      Object.values(seasonCounts).forEach(count => {
        expect(count).toBe(6);
      });
    });

    test('should start with 立春 and end with 大寒', () => {
      // Act
      const firstTerm = SOLAR_TERMS.find(term => term.order === 1);
      const lastTerm = SOLAR_TERMS.find(term => term.order === 24);

      // Assert
      expect(firstTerm.name).toBe('立春');
      expect(lastTerm.name).toBe('大寒');
    });
  });

  describe('getSolarTermChoices', () => {
    test('should return React Admin format choices', () => {
      // Act
      const choices = getSolarTermChoices();

      // Assert
      expect(choices).toHaveLength(24);
      choices.forEach(choice => {
        expect(choice).toHaveProperty('id');
        expect(choice).toHaveProperty('name');
        expect(typeof choice.id).toBe('string');
        expect(typeof choice.name).toBe('string');
        expect(choice.name).toContain('(');
        expect(choice.name).toContain(')');
      });
    });

    test('should include season information in display name', () => {
      // Act
      const choices = getSolarTermChoices();
      const springChoice = choices.find(choice => choice.id === '立春');

      // Assert
      expect(springChoice.name).toBe('立春 (春)');
    });

    test('should maintain correct order matching original data', () => {
      // Act
      const choices = getSolarTermChoices();

      // Assert
      expect(choices[0].id).toBe('立春');
      expect(choices[23].id).toBe('大寒');
    });
  });

  describe('getSolarTermsBySeason', () => {
    test('should group solar terms by season', () => {
      // Act
      const grouped = getSolarTermsBySeason();

      // Assert
      expect(grouped).toHaveProperty('春');
      expect(grouped).toHaveProperty('夏');
      expect(grouped).toHaveProperty('秋');
      expect(grouped).toHaveProperty('冬');
      
      Object.values(grouped).forEach(seasonTerms => {
        expect(seasonTerms).toHaveLength(6);
      });
    });

    test('should contain correct terms for spring season', () => {
      // Act
      const grouped = getSolarTermsBySeason();
      const springTerms = grouped['春'].map(term => term.name);

      // Assert
      expect(springTerms).toEqual(['立春', '雨水', '驚蟄', '春分', '清明', '穀雨']);
    });

    test('should maintain correct order within each season', () => {
      // Act
      const grouped = getSolarTermsBySeason();

      // Assert
      Object.values(grouped).forEach(seasonTerms => {
        for (let i = 1; i < seasonTerms.length; i++) {
          expect(seasonTerms[i].order).toBeGreaterThan(seasonTerms[i - 1].order);
        }
      });
    });
  });

  describe('getSolarTermByName', () => {
    test('should return correct solar term by name', () => {
      // Act
      const term = getSolarTermByName('清明');

      // Assert
      expect(term).toBeDefined();
      expect(term.name).toBe('清明');
      expect(term.order).toBe(5);
      expect(term.season).toBe('春');
      expect(term.description).toContain('掃墓祭祖');
    });

    test('should return null for non-existent term', () => {
      // Act
      const term = getSolarTermByName('不存在的節氣');

      // Assert
      expect(term).toBeNull();
    });

    test('should be case sensitive', () => {
      // Act
      const term = getSolarTermByName('清明');
      const wrongCase = getSolarTermByName('清明 '); // with space

      // Assert
      expect(term).toBeDefined();
      expect(wrongCase).toBeNull();
    });
  });

  describe('isValidSolarTerm', () => {
    test('should return true for valid solar term names', () => {
      // Arrange
      const validTerms = ['立春', '夏至', '秋分', '冬至'];

      // Act & Assert
      validTerms.forEach(term => {
        expect(isValidSolarTerm(term)).toBe(true);
      });
    });

    test('should return false for invalid solar term names', () => {
      // Arrange
      const invalidTerms = ['不存在', '', null, undefined, '立春 ', ' 立春'];

      // Act & Assert
      invalidTerms.forEach(term => {
        expect(isValidSolarTerm(term)).toBe(false);
      });
    });

    test('should validate all 24 solar terms', () => {
      // Act & Assert
      SOLAR_TERMS.forEach(term => {
        expect(isValidSolarTerm(term.name)).toBe(true);
      });
    });
  });

  describe('getAllSolarTermNames', () => {
    test('should return array of all solar term names', () => {
      // Act
      const names = getAllSolarTermNames();

      // Assert
      expect(names).toHaveLength(24);
      expect(names).toContain('立春');
      expect(names).toContain('大寒');
      names.forEach(name => {
        expect(typeof name).toBe('string');
      });
    });

    test('should maintain original order', () => {
      // Act
      const names = getAllSolarTermNames();

      // Assert
      expect(names[0]).toBe('立春');
      expect(names[4]).toBe('清明');
      expect(names[23]).toBe('大寒');
    });

    test('should not contain duplicates', () => {
      // Act
      const names = getAllSolarTermNames();
      const uniqueNames = [...new Set(names)];

      // Assert
      expect(names.length).toBe(uniqueNames.length);
    });
  });

  describe('Integration tests', () => {
    test('should work together for complete workflow', () => {
      // Arrange - User selects a solar term from React Admin choices
      const choices = getSolarTermChoices();
      const selectedChoice = choices.find(choice => choice.name.includes('清明'));
      
      // Act - Validate the selected term and get details
      const isValid = isValidSolarTerm(selectedChoice.id);
      const termDetails = getSolarTermByName(selectedChoice.id);
      const seasonGrouped = getSolarTermsBySeason();
      const springTerms = seasonGrouped['春'];

      // Assert - Complete workflow should work seamlessly
      expect(isValid).toBe(true);
      expect(termDetails.name).toBe('清明');
      expect(termDetails.season).toBe('春');
      expect(springTerms).toContainEqual(termDetails);
    });

    test('should handle edge cases gracefully', () => {
      // Act & Assert - Various edge cases
      expect(getSolarTermByName('')).toBeNull();
      expect(isValidSolarTerm(null)).toBe(false);
      expect(isValidSolarTerm(undefined)).toBe(false);
      expect(getAllSolarTermNames()).toHaveLength(24);
      
      const choices = getSolarTermChoices();
      expect(choices.every(choice => choice.id && choice.name)).toBe(true);
    });
  });
});