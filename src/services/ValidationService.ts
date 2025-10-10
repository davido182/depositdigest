
import { Tenant, Payment } from '@/types';
import { validateEmail, validateRentAmount, validateDepositAmount, validateDates, validateUnitNumber, ValidationError } from '@/utils/validation';

// Security utilities
const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};

export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  public validateTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>, existingTenants: Tenant[] = []): void {
    // Sanitize all string inputs to prevent XSS
    const sanitizedTenant = {
      ...tenant,
      name: sanitizeHtml(tenant.name || ''),
      email: sanitizeHtml(tenant.email || ''),
      phone: sanitizeHtml(tenant.phone || ''),
      unit: sanitizeHtml(tenant.unit || ''),
      notes: sanitizeHtml(tenant.notes || '')
    };

    // Validate required fields
    if (!sanitizedTenant.name?.trim()) {
      throw new ValidationError('Tenant name is required');
    }

    // Length validation for security
    if (sanitizedTenant.name.length > 100) {
      throw new ValidationError('Tenant name must be less than 100 characters');
    }

    // Validate email if provided
    if (sanitizedTenant.email && !validateEmail(sanitizedTenant.email)) {
      throw new ValidationError('Please enter a valid email address');
    }

    // Phone validation with security checks
    if (sanitizedTenant.phone && !this.validatePhone(sanitizedTenant.phone)) {
      throw new ValidationError('Please enter a valid phone number');
    }

    // Validate rent amount with security bounds
    validateRentAmount(sanitizedTenant.rentAmount);
    if (sanitizedTenant.rentAmount > 50000) {
      throw new ValidationError('Rent amount seems unreasonably high');
    }

    // Validate deposit if provided
    if (sanitizedTenant.depositAmount > 0) {
      validateDepositAmount(sanitizedTenant.depositAmount, sanitizedTenant.rentAmount);
    }

    // Validate dates with security checks
    validateDates(sanitizedTenant.moveInDate, sanitizedTenant.leaseEndDate);
    if (sanitizedTenant.moveInDate && !this.isValidDateRange(sanitizedTenant.moveInDate)) {
      throw new ValidationError('Move-in date is outside valid range');
    }

    // Validate unit availability
    validateUnitNumber(sanitizedTenant.unit, [], undefined, existingTenants);

    // Check for duplicate email with case-insensitive comparison
    if (sanitizedTenant.email) {
      const duplicateEmail = existingTenants.find(t => 
        t.email.toLowerCase() === sanitizedTenant.email.toLowerCase()
      );
      if (duplicateEmail) {
        throw new ValidationError(`Email ${sanitizedTenant.email} is already in use`);
      }
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'late', 'notice'];
    if (sanitizedTenant.status && !validStatuses.includes(sanitizedTenant.status)) {
      throw new ValidationError('Invalid tenant status');
    }
  }

  public validateTenantUpdate(tenant: Tenant, existingTenants: Tenant[] = []): void {
    // Filter out current tenant from existing tenants for validation
    const otherTenants = existingTenants.filter(t => t.id !== tenant.id);
    this.validateTenant(tenant, otherTenants);
  }

  public validatePayment(payment: Omit<Payment, 'id' | 'createdAt'>, tenants: Tenant[] = []): void {
    // Validate tenant exists
    const tenant = tenants.find(t => t.id === payment.tenantId);
    if (!tenant) {
      throw new ValidationError('Selected tenant does not exist');
    }

    // Validate payment amount
    if (payment.amount <= 0) {
      throw new ValidationError('Payment amount must be greater than zero');
    }

    // Validate payment date
    const paymentDate = new Date(payment.date);
    const today = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(futureLimit.getDate() + 7); // Allow up to 7 days in future

    if (paymentDate > futureLimit) {
      throw new ValidationError('Payment date cannot be more than 7 days in the future');
    }

    // Warn if payment amount is significantly different from rent
    if (payment.type === 'rent' && tenant.rentAmount > 0) {
      const difference = Math.abs(payment.amount - tenant.rentAmount);
      const percentDiff = (difference / tenant.rentAmount) * 100;
      
      if (percentDiff > 20) {
        throw new ValidationError(
          `Payment amount (${payment.amount}) differs significantly from expected rent (${tenant.rentAmount}). Please verify.`
        );
      }
    }
  }

  public validateUnitCount(newCount: number, currentTenants: Tenant[] = []): void {
    if (newCount <= 0) {
      throw new ValidationError('Unit count must be greater than zero');
    }

    if (newCount > 100) {
      throw new ValidationError('Unit count seems unusually high. Please verify.');
    }

    // Check if reducing units below current occupancy
    const activeTenants = currentTenants.filter(t => t.status === 'active');
    const highestUnit = Math.max(...activeTenants.map(t => parseInt(t.unit) || 0));

    if (newCount < highestUnit) {
      throw new ValidationError(
        `Cannot reduce units to ${newCount}. Unit ${highestUnit} is currently occupied.`
      );
    }
  }

  // Additional security validation methods
  public validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remove common formatting characters
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // International phone number regex (E.164 format)
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    
    // US phone number format
    const usPhoneRegex = /^(\+1)?[\s\-\.]?(\([0-9]{3}\)|[0-9]{3})[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4}$/;
    
    return phoneRegex.test(cleanPhone) || usPhoneRegex.test(phone);
  }

  public validateUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') return false;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  public sanitizeInput(input: string | null | undefined): string {
    if (!input) return '';
    return sanitizeHtml(input);
  }

  public validateSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') return '';
    
    // Sanitize the query
    const sanitized = this.sanitizeInput(query);
    
    // Limit length to prevent DoS
    if (sanitized.length > 100) {
      return sanitized.substring(0, 100);
    }
    
    return sanitized;
  }

  public validateFileUpload(file: File, allowedTypes: string[], maxSize: number): void {
    if (!file) {
      throw new ValidationError('No file provided');
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError(`File type ${file.type} is not allowed`);
    }

    // Check file size
    if (file.size > maxSize) {
      throw new ValidationError(`File size exceeds maximum allowed size`);
    }

    // Check file name for malicious patterns
    const fileName = file.name;
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      throw new ValidationError('Invalid file name');
    }
  }

  public validateRateLimit(userId: string, action: string, maxAttempts: number, timeWindow: number): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    
    // Get stored attempts from localStorage (in production, use Redis or similar)
    const stored = localStorage.getItem(`rate_limit_${key}`);
    let attempts: number[] = stored ? JSON.parse(stored) : [];
    
    // Remove old attempts outside time window
    attempts = attempts.filter(timestamp => now - timestamp < timeWindow);
    
    // Check if limit exceeded
    if (attempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    attempts.push(now);
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify(attempts));
    
    return true;
  }

  private isValidDateRange(dateString: string): boolean {
    if (!dateString || typeof dateString !== 'string') return false;
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return false;
    
    // Check if date is not too far in the past or future
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago
    const maxDate = new Date(now.getFullYear() + 50, 11, 31); // 50 years from now
    
    return date >= minDate && date <= maxDate;
  }
}
