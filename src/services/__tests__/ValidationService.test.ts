import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../ValidationService';
import { Tenant } from '@/types';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = ValidationService.getInstance();
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(validationService.validateEmail(email)).toBe(true);
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
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validationService.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(555) 123-4567',
        '555-123-4567',
        '555.123.4567',
        '5551234567',
        '+34 123 456 789'
      ];

      validPhones.forEach(phone => {
        expect(validationService.validatePhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        'abc-def-ghij',
        '555-123',
        '++1234567890',
        ''
      ];

      invalidPhones.forEach(phone => {
        expect(validationService.validatePhone(phone)).toBe(false);
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

  describe('sanitizeInput', () => {
    it('should remove dangerous HTML tags', () => {
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<div onclick="alert(1)">Click me</div>',
        'Hello <script>alert("world")</script>'
      ];

      dangerousInputs.forEach(input => {
        const sanitized = validationService.sanitizeInput(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onclick');
      });
    });

    it('should preserve safe content', () => {
      const safeInputs = [
        'Hello World',
        'User Name 123',
        'test@example.com',
        '(555) 123-4567'
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
  });

  describe('validateTenant', () => {
    const validTenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'> = {
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

    it('should reject tenant with invalid email', () => {
      const invalidTenant = { ...validTenant, email: 'invalid-email' };
      expect(() => validationService.validateTenant(invalidTenant, [])).toThrow('Invalid email format');
    });

    it('should reject tenant with negative rent amount', () => {
      const invalidTenant = { ...validTenant, rentAmount: -100 };
      expect(() => validationService.validateTenant(invalidTenant, [])).toThrow('Rent amount must be positive');
    });

    it('should reject tenant with invalid date format', () => {
      const invalidTenant = { ...validTenant, moveInDate: 'invalid-date' };
      expect(() => validationService.validateTenant(invalidTenant, [])).toThrow('Invalid move-in date format');
    });

    it('should reject tenant with lease end date before move-in date', () => {
      const invalidTenant = { 
        ...validTenant, 
        moveInDate: '2024-12-31',
        leaseEndDate: '2024-01-01'
      };
      expect(() => validationService.validateTenant(invalidTenant, [])).toThrow('Lease end date must be after move-in date');
    });

    it('should detect duplicate email addresses', () => {
      const existingTenants: Tenant[] = [{
        ...validTenant,
        id: '1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        paymentHistory: []
      }];

      const duplicateTenant = { ...validTenant, name: 'Jane Doe' };
      expect(() => validationService.validateTenant(duplicateTenant, existingTenants))
        .toThrow('Email address already exists');
    });

    it('should detect duplicate unit assignments', () => {
      const existingTenants: Tenant[] = [{
        ...validTenant,
        id: '1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        paymentHistory: []
      }];

      const duplicateTenant = { ...validTenant, name: 'Jane Doe', email: 'jane@example.com' };
      expect(() => validationService.validateTenant(duplicateTenant, existingTenants))
        .toThrow('Unit 101 is already occupied');
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
      updatedAt: '2024-01-01T00:00:00Z',
      paymentHistory: []
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
      updatedAt: '2024-01-01T00:00:00Z',
      paymentHistory: []
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
        .toThrow('Email address already exists');
    });

    it('should reject unit that conflicts with other tenant', () => {
      const updatedTenant = { ...existingTenant, unit: '102' };
      expect(() => validationService.validateTenantUpdate(updatedTenant, [existingTenant, otherTenant]))
        .toThrow('Unit 102 is already occupied');
    });
  });

  describe('validateProperty', () => {
    it('should validate correct property data', () => {
      const validProperty = {
        name: 'Test Property',
        address: '123 Test St',
        total_units: 5,
        description: 'A test property'
      };

      expect(() => validationService.validateProperty(validProperty)).not.toThrow();
    });

    it('should reject property with empty name', () => {
      const invalidProperty = {
        name: '',
        address: '123 Test St',
        total_units: 5,
        description: 'A test property'
      };

      expect(() => validationService.validateProperty(invalidProperty)).toThrow('Property name is required');
    });

    it('should reject property with zero or negative units', () => {
      const invalidProperty = {
        name: 'Test Property',
        address: '123 Test St',
        total_units: 0,
        description: 'A test property'
      };

      expect(() => validationService.validateProperty(invalidProperty)).toThrow('Total units must be greater than 0');
    });

    it('should reject property with excessive units', () => {
      const invalidProperty = {
        name: 'Test Property',
        address: '123 Test St',
        total_units: 1001,
        description: 'A test property'
      };

      expect(() => validationService.validateProperty(invalidProperty)).toThrow('Total units cannot exceed 1000');
    });
  });

  describe('validateUnit', () => {
    it('should validate correct unit data', () => {
      const validUnit = {
        unit_number: '101',
        monthly_rent: 1000,
        is_available: true,
        property_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => validationService.validateUnit(validUnit)).not.toThrow();
    });

    it('should reject unit with empty unit number', () => {
      const invalidUnit = {
        unit_number: '',
        monthly_rent: 1000,
        is_available: true,
        property_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => validationService.validateUnit(invalidUnit)).toThrow('Unit number is required');
    });

    it('should reject unit with negative rent', () => {
      const invalidUnit = {
        unit_number: '101',
        monthly_rent: -100,
        is_available: true,
        property_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(() => validationService.validateUnit(invalidUnit)).toThrow('Monthly rent must be non-negative');
    });

    it('should reject unit with invalid property ID', () => {
      const invalidUnit = {
        unit_number: '101',
        monthly_rent: 1000,
        is_available: true,
        property_id: 'invalid-uuid'
      };

      expect(() => validationService.validateUnit(invalidUnit)).toThrow('Invalid property ID format');
    });
  });
});