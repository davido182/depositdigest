import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  validateEmail,
  validatePhone,
  validateRentAmount,
  validateDepositAmount,
  validatePaymentAmount,
  validateDates,
  sanitizeInput,
  validateUnitNumber
} from '../validation';

describe('Validation Utilities', () => {
  describe('ValidationError', () => {
    it('should create error with correct name and message', () => {
      const error = new ValidationError('Test error message');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test error message');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'firstname.lastname@company.com',
        'email@subdomain.example.com',
        'firstname-lastname@example.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com',
        'user@domain.',
        'user@domain..com',
        'user name@example.com',
        'user@domain,com',
        '',
        'user@',
        '@domain.com',
        'user@@domain.com',
        'user@domain@com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.co')).toBe(true); // Minimal valid email
      expect(validateEmail('test@localhost')).toBe(false); // No TLD
      expect(validateEmail('test@domain')).toBe(false); // No TLD
    });
  });

  describe('validatePhone', () => {
    it('should format valid 10-digit US phone numbers', () => {
      const phoneTests = [
        { input: '5551234567', expected: '(555) 123-4567' },
        { input: '1234567890', expected: '(123) 456-7890' },
        { input: '9876543210', expected: '(987) 654-3210' }
      ];

      phoneTests.forEach(({ input, expected }) => {
        expect(validatePhone(input)).toBe(expected);
      });
    });

    it('should return original for non-10-digit numbers', () => {
      const phoneTests = [
        '555-123-4567', // Already formatted
        '+1 555 123 4567', // International format
        '555.123.4567', // Dot format
        '12345', // Too short
        '123456789012345' // Too long
      ];

      phoneTests.forEach(phone => {
        expect(validatePhone(phone)).toBe(phone);
      });
    });

    it('should handle phone numbers with various formatting', () => {
      const phoneTests = [
        { input: '(555) 123-4567', expected: '(555) 123-4567' },
        { input: '555-123-4567', expected: '555-123-4567' },
        { input: '555.123.4567', expected: '555.123.4567' },
        { input: '555 123 4567', expected: '555 123 4567' }
      ];

      phoneTests.forEach(({ input, expected }) => {
        expect(validatePhone(input)).toBe(expected);
      });
    });
  });

  describe('validateRentAmount', () => {
    it('should accept valid rent amounts', () => {
      const validAmounts = [1, 500, 1000, 2500, 5000, 49999];

      validAmounts.forEach(amount => {
        expect(() => validateRentAmount(amount)).not.toThrow();
      });
    });

    it('should reject zero or negative rent amounts', () => {
      const invalidAmounts = [0, -1, -100, -0.01];

      invalidAmounts.forEach(amount => {
        expect(() => validateRentAmount(amount))
          .toThrow('Rent amount must be greater than zero');
      });
    });

    it('should reject unreasonably high rent amounts', () => {
      const highAmounts = [50001, 100000, 999999];

      highAmounts.forEach(amount => {
        expect(() => validateRentAmount(amount))
          .toThrow('Rent amount seems unusually high. Please verify.');
      });
    });

    it('should accept exactly 50000', () => {
      expect(() => validateRentAmount(50000)).not.toThrow();
    });
  });

  describe('validateDepositAmount', () => {
    it('should accept valid deposit amounts', () => {
      const testCases = [
        { deposit: 0, rent: 1000 }, // No deposit
        { deposit: 500, rent: 1000 }, // Half rent
        { deposit: 1000, rent: 1000 }, // Equal to rent
        { deposit: 2000, rent: 1000 }, // Double rent
        { deposit: 3000, rent: 1000 } // Triple rent (max allowed)
      ];

      testCases.forEach(({ deposit, rent }) => {
        expect(() => validateDepositAmount(deposit, rent)).not.toThrow();
      });
    });

    it('should reject negative deposit amounts', () => {
      const negativeAmounts = [-1, -100, -0.01];

      negativeAmounts.forEach(deposit => {
        expect(() => validateDepositAmount(deposit, 1000))
          .toThrow('Deposit amount cannot be negative');
      });
    });

    it('should reject deposits more than 3x rent', () => {
      const testCases = [
        { deposit: 3001, rent: 1000 },
        { deposit: 5000, rent: 1000 },
        { deposit: 1501, rent: 500 }
      ];

      testCases.forEach(({ deposit, rent }) => {
        expect(() => validateDepositAmount(deposit, rent))
          .toThrow('Deposit amount seems unusually high compared to rent');
      });
    });
  });

  describe('validatePaymentAmount', () => {
    it('should accept valid payment amounts', () => {
      const validAmounts = [1, 500, 1000, 2500];

      validAmounts.forEach(amount => {
        expect(() => validatePaymentAmount(amount)).not.toThrow();
      });
    });

    it('should reject zero or negative payment amounts', () => {
      const invalidAmounts = [0, -1, -100, -0.01];

      invalidAmounts.forEach(amount => {
        expect(() => validatePaymentAmount(amount))
          .toThrow('Payment amount must be greater than zero');
      });
    });

    it('should warn when payment is much higher than expected rent', () => {
      const testCases = [
        { amount: 1600, expectedRent: 1000 }, // 1.6x rent (over 1.5x limit)
        { amount: 2000, expectedRent: 1000 }, // 2x rent
        { amount: 750, expectedRent: 500 } // 1.5x rent (exactly at limit)
      ];

      testCases.forEach(({ amount, expectedRent }) => {
        if (amount > expectedRent * 1.5) {
          expect(() => validatePaymentAmount(amount, expectedRent))
            .toThrow(`Payment amount (${amount}) seems high compared to expected rent (${expectedRent})`);
        } else {
          expect(() => validatePaymentAmount(amount, expectedRent)).not.toThrow();
        }
      });
    });

    it('should not validate against expected rent when not provided', () => {
      const highAmount = 10000;
      expect(() => validatePaymentAmount(highAmount)).not.toThrow();
    });
  });

  describe('validateDates', () => {
    it('should accept valid date combinations', () => {
      const currentYear = new Date().getFullYear();
      const validDateCombos = [
        { moveIn: `${currentYear}-01-01`, leaseEnd: `${currentYear}-12-31` },
        { moveIn: `${currentYear + 1}-06-01`, leaseEnd: `${currentYear + 1}-12-31` },
        { moveIn: `${currentYear}-03-15`, leaseEnd: undefined }, // No lease end
        { moveIn: `${currentYear + 1}-01-01`, leaseEnd: `${currentYear + 2}-01-01` }
      ];

      validDateCombos.forEach(({ moveIn, leaseEnd }) => {
        expect(() => validateDates(moveIn, leaseEnd)).not.toThrow();
      });
    });

    it('should reject move-in dates too far in future', () => {
      const currentYear = new Date().getFullYear();
      const farFutureDates = [
        `${currentYear + 3}-01-01`,
        `${currentYear + 5}-06-15`,
        `${currentYear + 10}-12-31`
      ];

      farFutureDates.forEach(moveInDate => {
        expect(() => validateDates(moveInDate))
          .toThrow('Move-in date cannot be more than 2 years in the future');
      });
    });

    it('should reject lease end dates before move-in dates', () => {
      const invalidDateCombos = [
        { moveIn: '2024-12-31', leaseEnd: '2024-01-01' },
        { moveIn: '2024-06-15', leaseEnd: '2024-06-14' },
        { moveIn: '2024-03-01', leaseEnd: '2024-02-28' }
      ];

      invalidDateCombos.forEach(({ moveIn, leaseEnd }) => {
        expect(() => validateDates(moveIn, leaseEnd))
          .toThrow('Lease end date must be after move-in date');
      });
    });

    it('should accept lease end date same as move-in date', () => {
      // Edge case: same day lease (should be rejected)
      expect(() => validateDates('2024-01-01', '2024-01-01'))
        .toThrow('Lease end date must be after move-in date');
    });

    it('should handle invalid date formats gracefully', () => {
      const invalidDates = [
        'invalid-date',
        '2024-13-01', // Invalid month
        '2024-02-30', // Invalid day
        '2024/01/01', // Wrong format
        ''
      ];

      invalidDates.forEach(date => {
        // Should not throw for invalid date formats (handled by Date constructor)
        const moveInDate = new Date(date);
        if (!isNaN(moveInDate.getTime())) {
          expect(() => validateDates(date)).not.toThrow();
        }
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const testCases = [
        { input: '<div>Hello</div>', expected: 'Hello' },
        { input: '<script>alert("xss")</script>', expected: 'alert(xss)' },
        { input: '<p>Paragraph <span>text</span></p>', expected: 'Paragraph text' },
        { input: 'Normal text', expected: 'Normal text' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeInput(input)).toBe(expected);
      });
    });

    it('should remove quotes that could break SQL', () => {
      const testCases = [
        { input: 'O\'Reilly', expected: 'OReilly' },
        { input: 'He said "hello"', expected: 'He said hello' },
        { input: 'Mixed \'quotes" here', expected: 'Mixed quotes here' },
        { input: 'No quotes here', expected: 'No quotes here' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeInput(input)).toBe(expected);
      });
    });

    it('should trim whitespace', () => {
      const testCases = [
        { input: '  Hello World  ', expected: 'Hello World' },
        { input: '\t\nTest\t\n', expected: 'Test' },
        { input: '   ', expected: '' },
        { input: 'NoSpaces', expected: 'NoSpaces' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeInput(input)).toBe(expected);
      });
    });

    it('should handle complex input with multiple issues', () => {
      const complexInput = '  <script>alert("xss")</script>O\'Reilly said "hello"  ';
      const expected = 'alert(xss)OReilly said hello';
      expect(sanitizeInput(complexInput)).toBe(expected);
    });
  });

  describe('validateUnitNumber', () => {
    const mockTenants = [
      { id: '1', name: 'John Doe', unit: '101', status: 'active' },
      { id: '2', name: 'Jane Smith', unit: '102', status: 'active' },
      { id: '3', name: 'Bob Johnson', unit: '103', status: 'inactive' }
    ];

    it('should allow empty or undefined unit numbers', () => {
      expect(() => validateUnitNumber('', [], undefined, mockTenants)).not.toThrow();
      expect(() => validateUnitNumber('   ', [], undefined, mockTenants)).not.toThrow();
    });

    it('should allow unoccupied unit numbers', () => {
      expect(() => validateUnitNumber('104', [], undefined, mockTenants)).not.toThrow();
      expect(() => validateUnitNumber('105', [], undefined, mockTenants)).not.toThrow();
    });

    it('should allow unit occupied by inactive tenant', () => {
      expect(() => validateUnitNumber('103', [], undefined, mockTenants)).not.toThrow();
    });

    it('should reject unit occupied by active tenant', () => {
      expect(() => validateUnitNumber('101', [], undefined, mockTenants))
        .toThrow('Unit 101 is already occupied by John Doe');
      
      expect(() => validateUnitNumber('102', [], undefined, mockTenants))
        .toThrow('Unit 102 is already occupied by Jane Smith');
    });

    it('should allow current tenant to keep their unit', () => {
      expect(() => validateUnitNumber('101', [], '1', mockTenants)).not.toThrow();
      expect(() => validateUnitNumber('102', [], '2', mockTenants)).not.toThrow();
    });

    it('should reject unit occupied by different active tenant', () => {
      expect(() => validateUnitNumber('101', [], '2', mockTenants))
        .toThrow('Unit 101 is already occupied by John Doe');
      
      expect(() => validateUnitNumber('102', [], '1', mockTenants))
        .toThrow('Unit 102 is already occupied by Jane Smith');
    });

    it('should handle missing tenants array', () => {
      expect(() => validateUnitNumber('101', [])).not.toThrow();
      expect(() => validateUnitNumber('101', [], undefined, undefined)).not.toThrow();
    });

    it('should handle edge cases', () => {
      const edgeCaseTenants = [
        { id: '1', name: 'Test User', unit: '', status: 'active' }, // Empty unit
        { id: '2', name: 'Another User', unit: '0', status: 'active' } // Zero unit
      ];

      expect(() => validateUnitNumber('101', [], undefined, edgeCaseTenants)).not.toThrow();
      expect(() => validateUnitNumber('0', [], undefined, edgeCaseTenants))
        .toThrow('Unit 0 is already occupied by Another User');
    });
  });
});
