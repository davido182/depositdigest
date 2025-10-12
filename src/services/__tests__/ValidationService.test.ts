import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationService } from '../ValidationService';
import { Tenant, Payment } from '@/types';
import { ValidationError } from '@/utils/validation';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = ValidationService.getInstance();
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('email validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'firstname.lastname@company.com',
        'email@123.123.123.123', // IP address
        'user@domain-one.com'
      ];

      validEmails.forEach(email => {
        expect(() => {
          const tenant = {
            name: 'Test User',
            email,
            phone: '(555) 123-4567',
            unit: '101',
            moveInDate: '2024-01-01',
            rentAmount: 1000,
            depositAmount: 500,
            status: 'active' as const
          };
          validationService.validateTenant(tenant, []);
        }).not.toThrow();
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
        'user name@example.com', // space in email
        'user@domain,com', // comma instead of dot
        ''
      ];

      invalidEmails.forEach(email => {
        expect(() => {
          const tenant = {
            name: 'Test User',
            email,
            phone: '(555) 123-4567',
            unit: '101',
            moveInDate: '2024-01-01',
            rentAmount: 1000,
            depositAmount: 500,
            status: 'active' as const
          };
          validationService.validateTenant(tenant, []);
        }).toThrow('Please enter a valid email address');
      });
    });

    it('should handle case-insensitive duplicate email detection', () => {
      const existingTenants: Tenant[] = [{
        id: '1',
        name: 'Existing User',
        email: 'test@example.com',
        phone: '(555) 123-4567',
        unit: '101',
        moveInDate: '2024-01-01',
        rentAmount: 1000,
        depositAmount: 500,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }];

      const duplicateEmails = [
        'TEST@EXAMPLE.COM',
        'Test@Example.Com',
        'test@EXAMPLE.com'
      ];

      duplicateEmails.forEach(email => {
        expect(() => {
          const tenant = {
            name: 'New User',
            email,
            phone: '(555) 987-6543',
            unit: '102',
            moveInDate: '2024-01-01',
            rentAmount: 1000,
            depositAmount: 500,
            status: 'active' as const
          };
          validationService.validateTenant(tenant, existingTenants);
        }).toThrow(`Email ${email} is already in use`);
      });
    });
  });

  describe('phone validation', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(555) 123-4567',
        '555-123-4567',
        '555.123.4567',
        '5551234567',
        '+34 123 456 789',
        '+44 20 7946 0958', // UK number
        '+1 (555) 123-4567', // US with country code
        '555 123 4567' // spaces
      ];

      validPhones.forEach(phone => {
        expect(validationService.validatePhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123', // too short
        'abc-def-ghij', // letters
        '555-123', // incomplete
        '++1234567890', // double plus
        '123456789012345678', // too long
        '(555) 123-456', // incomplete US format
        '+', // just plus sign
        '000-000-0000' // all zeros
      ];

      invalidPhones.forEach(phone => {
        expect(validationService.validatePhone(phone)).toBe(false);
      });
    });

    it('should handle empty and null phone numbers', () => {
      expect(validationService.validatePhone('')).toBe(true); // Allow empty phone numbers
      expect(validationService.validatePhone(null as any)).toBe(true); // Allow null phone numbers
      expect(validationService.validatePhone(undefined as any)).toBe(true); // Allow undefined phone numbers
    });

    it('should validate phone numbers in tenant validation', () => {
      const invalidPhones = ['123', 'abc-def-ghij', '++1234567890'];

      invalidPhones.forEach(phone => {
        expect(() => {
          const tenant = {
            name: 'Test User',
            email: 'test@example.com',
            phone,
            unit: '101',
            moveInDate: '2024-01-01',
            rentAmount: 1000,
            depositAmount: 500,
            status: 'active' as const
          };
          validationService.validateTenant(tenant, []);
        }).toThrow('Please enter a valid phone number');
      });
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '00000000-0000-0000-0000-000000000000'
      ];

      validUUIDs.forEach(uuid => {
        expect(validationService.validateUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        '123e4567-e89b-12d3-a456',
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-426614174000-extra',
        '',
        '123e4567-e89b-12d3-a456-42661417400g'
      ];

      invalidUUIDs.forEach(uuid => {
        expect(validationService.validateUUID(uuid)).toBe(false);
      });
    });
  });

  describe('input sanitization', () => {
    it('should remove dangerous HTML tags and scripts', () => {
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<div onclick="alert(1)">Click me</div>',
        'Hello <script>alert("world")</script>',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)"></object>',
        '<embed src="javascript:alert(1)">',
        '<link rel="stylesheet" href="javascript:alert(1)">',
        '<style>body{background:url("javascript:alert(1)")}</style>'
      ];

      dangerousInputs.forEach(input => {
        const sanitized = validationService.sanitizeInput(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onclick');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('<object');
        expect(sanitized).not.toContain('<embed');
        expect(sanitized).not.toContain('<link');
        expect(sanitized).not.toContain('<style');
      });
    });

    it('should remove HTML tags and preserve text content', () => {
      const inputs = [
        { input: '<div>Hello World</div>', expected: 'Hello World' },
        { input: '<p>Test paragraph</p>', expected: 'Test paragraph' },
        { input: '<span>Inline text</span>', expected: 'Inline text' },
        { input: 'Normal text', expected: 'Normal text' }
      ];

      inputs.forEach(({ input, expected }) => {
        const sanitized = validationService.sanitizeInput(input);
        expect(sanitized).toBe(expected);
      });
    });

    it('should preserve safe content', () => {
      const safeInputs = [
        'Hello World',
        'User Name 123',
        'test@example.com',
        '(555) 123-4567',
        'Property at 123 Main St',
        'Notes: Good tenant, pays on time'
      ];

      safeInputs.forEach(input => {
        const sanitized = validationService.sanitizeInput(input);
        expect(sanitized).toBe(input);
      });
    });

    it('should handle empty and null inputs', () => {
      expect(validationService.sanitizeInput('')).toBe('');
      expect(validationService.sanitizeInput(null as any)).toBe('');
      expect(validationService.sanitizeInput(undefined as any)).toBe('');
    });

    it('should trim whitespace', () => {
      const inputs = [
        '  Hello World  ',
        '\t\nTest\t\n',
        '   Spaced   Text   '
      ];

      inputs.forEach(input => {
        const sanitized = validationService.sanitizeInput(input);
        expect(sanitized).toBe(input.replace(/<[^>]*>/g, '').trim());
      });
    });

    it('should sanitize inputs in tenant validation', () => {
      const tenant = {
        name: '<script>alert("xss")</script>John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        unit: '<div onclick="alert(1)">101</div>',
        moveInDate: '2024-01-01',
        rentAmount: 1000,
        depositAmount: 500,
        status: 'active' as const,
        notes: '<img src="x" onerror="alert(1)">Good tenant'
      };

      // Should not throw and should sanitize the inputs
      expect(() => validationService.validateTenant(tenant, [])).not.toThrow();
    });
  });

  describe('date validation', () => {
    it('should validate dates within reasonable range', () => {
      const currentYear = new Date().getFullYear();
      const validDates = [
        `${currentYear}-01-01`,
        `${currentYear + 1}-06-15`,
        `${currentYear - 1}-12-31`,
        `${currentYear + 2}-03-20`
      ];

      validDates.forEach(date => {
        const tenant = {
          name: 'Test User',
          email: 'test@example.com',
          phone: '(555) 123-4567',
          unit: '101',
          moveInDate: date,
          rentAmount: 1000,
          depositAmount: 500,
          status: 'active' as const
        };
        expect(() => validationService.validateTenant(tenant, [])).not.toThrow();
      });
    });

    it('should reject dates outside valid range', () => {
      const currentYear = new Date().getFullYear();
      const invalidDates = [
        `${currentYear - 101}-01-01`, // Too far in past
        `${currentYear + 51}-01-01`, // Too far in future
        'invalid-date',
        '2024-13-01', // Invalid month
        '2024-02-30', // Invalid day
        ''
      ];

      invalidDates.forEach(date => {
        const tenant = {
          name: 'Test User',
          email: 'test@example.com',
          phone: '(555) 123-4567',
          unit: '101',
          moveInDate: date,
          rentAmount: 1000,
          depositAmount: 500,
          status: 'active' as const
        };
        expect(() => validationService.validateTenant(tenant, [])).toThrow();
      });
    });

    it('should validate lease end date is after move-in date', () => {
      const tenant = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '(555) 123-4567',
        unit: '101',
        moveInDate: '2024-12-31',
        leaseEndDate: '2024-01-01',
        rentAmount: 1000,
        depositAmount: 500,
        status: 'active' as const
      };
      expect(() => validationService.validateTenant(tenant, [])).toThrow('Lease end date must be after move-in date');
    });
  });

  describe('search query validation', () => {
    it('should sanitize and validate search queries', () => {
      const validQueries = [
        'John Doe',
        'Unit 101',
        'test@example.com',
        'Property Name'
      ];

      validQueries.forEach(query => {
        const sanitized = validationService.validateSearchQuery(query);
        expect(sanitized).toBe(query);
      });
    });

    it('should sanitize dangerous search queries', () => {
      const dangerousQueries = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)'
      ];

      dangerousQueries.forEach(query => {
        const sanitized = validationService.validateSearchQuery(query);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('javascript:');
      });
    });

    it('should limit search query length', () => {
      const longQuery = 'a'.repeat(150);
      const sanitized = validationService.validateSearchQuery(longQuery);
      expect(sanitized.length).toBe(100);
    });

    it('should handle empty and null search queries', () => {
      expect(validationService.validateSearchQuery('')).toBe('');
      expect(validationService.validateSearchQuery(null as any)).toBe('');
      expect(validationService.validateSearchQuery(undefined as any)).toBe('');
    });
  });

  describe('file upload validation', () => {
    it('should validate correct file uploads', () => {
      const validFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      expect(() => validationService.validateFileUpload(validFile, allowedTypes, maxSize)).not.toThrow();
    });

    it('should reject files with invalid types', () => {
      const invalidFile = new File(['test content'], 'test.exe', { type: 'application/x-executable' });
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024;

      expect(() => validationService.validateFileUpload(invalidFile, allowedTypes, maxSize))
        .toThrow('File type application/x-executable is not allowed');
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const allowedTypes = ['application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      expect(() => validationService.validateFileUpload(largeFile, allowedTypes, maxSize))
        .toThrow('File size exceeds maximum allowed size');
    });

    it('should reject files with malicious names', () => {
      const maliciousNames = [
        '../../../etc/passwd',
        'test\\..\\file.pdf',
        'file/with/slashes.pdf'
      ];

      maliciousNames.forEach(fileName => {
        const file = new File(['test'], fileName, { type: 'application/pdf' });
        const allowedTypes = ['application/pdf'];
        const maxSize = 5 * 1024 * 1024;

        expect(() => validationService.validateFileUpload(file, allowedTypes, maxSize))
          .toThrow('Invalid file name');
      });
    });

    it('should reject null or undefined files', () => {
      const allowedTypes = ['application/pdf'];
      const maxSize = 5 * 1024 * 1024;

      expect(() => validationService.validateFileUpload(null as any, allowedTypes, maxSize))
        .toThrow('No file provided');
    });
  });

  describe('rate limiting validation', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should allow requests within rate limit', () => {
      const userId = 'user123';
      const action = 'login';
      const maxAttempts = 5;
      const timeWindow = 60000; // 1 minute

      // Should allow first 5 attempts
      for (let i = 0; i < maxAttempts; i++) {
        expect(validationService.validateRateLimit(userId, action, maxAttempts, timeWindow)).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const userId = 'user123';
      const action = 'login';
      const maxAttempts = 3;
      const timeWindow = 60000;

      // Use up the allowed attempts
      for (let i = 0; i < maxAttempts; i++) {
        validationService.validateRateLimit(userId, action, maxAttempts, timeWindow);
      }

      // Next attempt should be blocked
      expect(validationService.validateRateLimit(userId, action, maxAttempts, timeWindow)).toBe(false);
    });

    it('should reset rate limit after time window', () => {
      const userId = 'user123';
      const action = 'login';
      const maxAttempts = 2;
      const timeWindow = 100; // 100ms

      // Use up attempts
      validationService.validateRateLimit(userId, action, maxAttempts, timeWindow);
      validationService.validateRateLimit(userId, action, maxAttempts, timeWindow);

      // Should be blocked
      expect(validationService.validateRateLimit(userId, action, maxAttempts, timeWindow)).toBe(false);

      // Wait for time window to pass
      return new Promise(resolve => {
        setTimeout(() => {
          // Should be allowed again
          expect(validationService.validateRateLimit(userId, action, maxAttempts, timeWindow)).toBe(true);
          resolve(undefined);
        }, 150);
      });
    });

    it('should handle different users independently', () => {
      const action = 'login';
      const maxAttempts = 2;
      const timeWindow = 60000;

      // User 1 uses up attempts
      validationService.validateRateLimit('user1', action, maxAttempts, timeWindow);
      validationService.validateRateLimit('user1', action, maxAttempts, timeWindow);
      expect(validationService.validateRateLimit('user1', action, maxAttempts, timeWindow)).toBe(false);

      // User 2 should still be allowed
      expect(validationService.validateRateLimit('user2', action, maxAttempts, timeWindow)).toBe(true);
    });
  });

  describe('validateTenant', () => {
    const validTenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      unit: '101',
      moveInDate: '2024-01-01',
      leaseEndDate: '2024-12-31',
      rentAmount: 1000,
      depositAmount: 500,
      status: 'active'
    };

    it('should validate correct tenant data', () => {
      expect(() => validationService.validateTenant(validTenant, [])).not.toThrow();
    });

    it('should reject tenant with empty name', () => {
      const invalidTenant = { ...validTenant, name: '' };
      expect(() => validationService.validateTenant(invalidTenant, [])).toThrow('Tenant name is required');
    });

    it('should reject tenant with name too long', () => {
      const invalidTenant = { ...validTenant, name: 'a'.repeat(101) };
      expect(() => validationService.validateTenant(invalidTenant, [])).toThrow('Tenant name must be less than 100 characters');
    });

    it('should reject tenant with invalid email', () => {
      const invalidTenant = { ...validTenant, email: 'invalid-email' };
      expect(() => validationService.validateTenant(invalidTenant, [])).toThrow('Please enter a valid email address');
    });

    it('should reject tenant with negative rent amount', () => {
      const invalidTenant = { ...validTenant, rentAmount: -100 };
      expect(() => validationService.validateTenant(invalidTenant, [])).toThrow('Rent amount must be greater than zero');
    });

    it('should reject tenant with unreasonably high rent', () => {
      const invalidTenant = { ...validTenant, rentAmount: 60000 };
      expect(() => validationService.validateTenant(invalidTenant, [])).toThrow('Rent amount seems unusually high. Please verify.');
    });

    it('should reject tenant with invalid status', () => {
      const invalidTenant = { ...validTenant, status: 'invalid' as any };
      expect(() => validationService.validateTenant(invalidTenant, [])).toThrow('Invalid tenant status');
    });

    it('should detect duplicate email addresses', () => {
      const existingTenants: Tenant[] = [{
        ...validTenant,
        id: '1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }];

      const duplicateTenant = { ...validTenant, name: 'Jane Doe' };
      expect(() => validationService.validateTenant(duplicateTenant, existingTenants))
        .toThrow(`Email ${validTenant.email} is already in use`);
    });

    it('should detect duplicate unit assignments', () => {
      const existingTenants: Tenant[] = [{
        ...validTenant,
        id: '1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }];

      const duplicateTenant = { ...validTenant, name: 'Jane Doe', email: 'jane@example.com' };
      expect(() => validationService.validateTenant(duplicateTenant, existingTenants))
        .toThrow('Unit 101 is already occupied by John Doe');
    });
  });

  describe('validateTenantUpdate', () => {
    const existingTenant: Tenant = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      unit: '101',
      moveInDate: '2024-01-01',
      leaseEndDate: '2024-12-31',
      rentAmount: 1000,
      depositAmount: 500,
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    const otherTenant: Tenant = {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '(555) 987-6543',
      unit: '102',
      moveInDate: '2024-01-01',
      leaseEndDate: '2024-12-31',
      rentAmount: 1200,
      depositAmount: 600,
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    it('should allow valid updates', () => {
      const updatedTenant = { ...existingTenant, name: 'John Updated' };
      expect(() => validationService.validateTenantUpdate(updatedTenant, [existingTenant, otherTenant]))
        .not.toThrow();
    });

    it('should allow keeping same email for same tenant', () => {
      const updatedTenant = { ...existingTenant, name: 'John Updated' };
      expect(() => validationService.validateTenantUpdate(updatedTenant, [existingTenant, otherTenant]))
        .not.toThrow();
    });

    it('should reject email that conflicts with other tenant', () => {
      const updatedTenant = { ...existingTenant, email: 'jane@example.com' };
      expect(() => validationService.validateTenantUpdate(updatedTenant, [existingTenant, otherTenant]))
        .toThrow(`Email jane@example.com is already in use`);
    });

    it('should reject unit that conflicts with other tenant', () => {
      const updatedTenant = { ...existingTenant, unit: '102' };
      expect(() => validationService.validateTenantUpdate(updatedTenant, [existingTenant, otherTenant]))
        .toThrow('Unit 102 is already occupied by Jane Smith');
    });
  });

  describe('validatePayment', () => {
    const testTenant: Tenant = {
      id: 'tenant-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      unit: '101',
      moveInDate: '2024-01-01',
      rentAmount: 1000,
      depositAmount: 500,
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    it('should validate correct payment data', () => {
      const validPayment: Omit<Payment, 'id' | 'createdAt'> = {
        tenantId: 'tenant-1',
        amount: 1000,
        date: '2024-01-01',
        type: 'rent',
        method: 'check'
      };

      expect(() => validationService.validatePayment(validPayment, [testTenant])).not.toThrow();
    });

    it('should reject payment for non-existent tenant', () => {
      const invalidPayment: Omit<Payment, 'id' | 'createdAt'> = {
        tenantId: 'non-existent',
        amount: 1000,
        date: '2024-01-01',
        type: 'rent',
        method: 'check'
      };

      expect(() => validationService.validatePayment(invalidPayment, [testTenant]))
        .toThrow('Selected tenant does not exist');
    });

    it('should reject payment with zero or negative amount', () => {
      const invalidPayments = [
        { amount: 0 },
        { amount: -100 },
        { amount: -0.01 }
      ];

      invalidPayments.forEach(({ amount }) => {
        const payment: Omit<Payment, 'id' | 'createdAt'> = {
          tenantId: 'tenant-1',
          amount,
          date: '2024-01-01',
          type: 'rent',
          method: 'check'
        };

        expect(() => validationService.validatePayment(payment, [testTenant]))
          .toThrow('Payment amount must be greater than zero');
      });
    });

    it('should reject payment date too far in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10); // 10 days in future

      const invalidPayment: Omit<Payment, 'id' | 'createdAt'> = {
        tenantId: 'tenant-1',
        amount: 1000,
        date: futureDate.toISOString().split('T')[0],
        type: 'rent',
        method: 'check'
      };

      expect(() => validationService.validatePayment(invalidPayment, [testTenant]))
        .toThrow('Payment date cannot be more than 7 days in the future');
    });

    it('should warn when rent payment differs significantly from expected rent', () => {
      const payments = [
        { amount: 1300, expectedError: true }, // 30% higher
        { amount: 700, expectedError: true },  // 30% lower
        { amount: 1200, expectedError: false }, // 20% higher - should pass
        { amount: 800, expectedError: false }   // 20% lower - should pass
      ];

      payments.forEach(({ amount, expectedError }) => {
        const payment: Omit<Payment, 'id' | 'createdAt'> = {
          tenantId: 'tenant-1',
          amount,
          date: '2024-01-01',
          type: 'rent',
          method: 'check'
        };

        if (expectedError) {
          expect(() => validationService.validatePayment(payment, [testTenant]))
            .toThrow(/Payment amount.*differs significantly from expected rent/);
        } else {
          expect(() => validationService.validatePayment(payment, [testTenant])).not.toThrow();
        }
      });
    });

    it('should allow non-rent payments without rent comparison', () => {
      const payment: Omit<Payment, 'id' | 'createdAt'> = {
        tenantId: 'tenant-1',
        amount: 2000, // Much higher than rent
        date: '2024-01-01',
        type: 'deposit',
        method: 'check'
      };

      expect(() => validationService.validatePayment(payment, [testTenant])).not.toThrow();
    });
  });

  describe('validateUnitCount', () => {
    const activeTenants: Tenant[] = [
      {
        id: '1',
        name: 'Tenant 1',
        email: 'tenant1@example.com',
        phone: '(555) 123-4567',
        unit: '5',
        moveInDate: '2024-01-01',
        rentAmount: 1000,
        depositAmount: 500,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Tenant 2',
        email: 'tenant2@example.com',
        phone: '(555) 987-6543',
        unit: '3',
        moveInDate: '2024-01-01',
        rentAmount: 1200,
        depositAmount: 600,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        name: 'Inactive Tenant',
        email: 'inactive@example.com',
        phone: '(555) 111-2222',
        unit: '10',
        moveInDate: '2024-01-01',
        rentAmount: 1100,
        depositAmount: 550,
        status: 'inactive',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    it('should validate reasonable unit counts', () => {
      const validCounts = [1, 5, 10, 50, 100];

      validCounts.forEach(count => {
        expect(() => validationService.validateUnitCount(count, [])).not.toThrow();
      });
    });

    it('should reject zero or negative unit counts', () => {
      const invalidCounts = [0, -1, -10];

      invalidCounts.forEach(count => {
        expect(() => validationService.validateUnitCount(count, []))
          .toThrow('Unit count must be greater than zero');
      });
    });

    it('should reject unreasonably high unit counts', () => {
      expect(() => validationService.validateUnitCount(101, []))
        .toThrow('Unit count seems unusually high. Please verify.');
    });

    it('should prevent reducing units below current occupancy', () => {
      // Highest occupied unit is 5, so reducing to 4 should fail
      expect(() => validationService.validateUnitCount(4, activeTenants))
        .toThrow('Cannot reduce units to 4. Unit 5 is currently occupied.');
    });

    it('should allow reducing units if no active tenants in higher units', () => {
      // Highest active unit is 5, so reducing to 6 should work
      expect(() => validationService.validateUnitCount(6, activeTenants)).not.toThrow();
    });

    it('should ignore inactive tenants when checking occupancy', () => {
      // Unit 10 is occupied by inactive tenant, should be ignored
      expect(() => validationService.validateUnitCount(8, activeTenants)).not.toThrow();
    });
  });

});