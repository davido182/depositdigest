
import { Tenant, Payment } from '@/types';
import { validateEmail, validateRentAmount, validateDepositAmount, validateDates, validateUnitNumber, ValidationError } from '@/utils/validation';

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
    // Validate required fields
    if (!tenant.name?.trim()) {
      throw new ValidationError('Tenant name is required');
    }

    // Validate email if provided
    if (tenant.email && !validateEmail(tenant.email)) {
      throw new ValidationError('Please enter a valid email address');
    }

    // Validate rent amount
    validateRentAmount(tenant.rentAmount);

    // Validate deposit if provided
    if (tenant.depositAmount > 0) {
      validateDepositAmount(tenant.depositAmount, tenant.rentAmount);
    }

    // Validate dates
    validateDates(tenant.moveInDate, tenant.leaseEndDate);

    // Validate unit availability
    validateUnitNumber(tenant.unit, [], undefined, existingTenants);

    // Check for duplicate email
    if (tenant.email) {
      const duplicateEmail = existingTenants.find(t => 
        t.email.toLowerCase() === tenant.email.toLowerCase()
      );
      if (duplicateEmail) {
        throw new ValidationError(`Email ${tenant.email} is already in use`);
      }
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
}
