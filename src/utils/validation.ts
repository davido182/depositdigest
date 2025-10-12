
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  // Check for spaces and basic format issues
  if (email.includes(' ') || email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return false;
  }
  
  // Must have exactly one @ symbol
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) return false;
  
  // Basic email regex that requires TLD
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Only format if it's exactly 10 digits and doesn't already have formatting
  if (cleaned.length === 10 && !/[()-.\s]/.test(phone)) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone; // Return original for all other cases
};

export const validateRentAmount = (amount: number): void => {
  if (amount <= 0) {
    throw new ValidationError('Rent amount must be greater than zero');
  }
  if (amount > 50000) {
    throw new ValidationError('Rent amount seems unusually high. Please verify.');
  }
};

export const validateDepositAmount = (deposit: number, rent: number): void => {
  if (deposit < 0) {
    throw new ValidationError('Deposit amount cannot be negative');
  }
  if (deposit > rent * 3) {
    throw new ValidationError('Deposit amount seems unusually high compared to rent');
  }
};

export const validatePaymentAmount = (amount: number, expectedRent?: number): void => {
  if (amount <= 0) {
    throw new ValidationError('Payment amount must be greater than zero');
  }
  if (expectedRent && amount > expectedRent * 1.5) {
    throw new ValidationError(`Payment amount (${amount}) seems high compared to expected rent (${expectedRent})`);
  }
};

export const validateDates = (moveInDate: string, leaseEndDate?: string): void => {
  const moveIn = new Date(moveInDate);
  const today = new Date();
  
  if (moveIn > new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())) {
    throw new ValidationError('Move-in date cannot be more than 2 years in the future');
  }
  
  if (leaseEndDate) {
    const leaseEnd = new Date(leaseEndDate);
    if (leaseEnd <= moveIn) {
      throw new ValidationError('Lease end date must be after move-in date');
    }
  }
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags completely
    .replace(/'/g, '') // Remove single quotes
    .replace(/"/g, '') // Remove double quotes  
    .trim();
};

export const validateUnitNumber = (unit: string, existingUnits: string[], currentTenantId?: string, tenants?: any[]): void => {
  // Unit number is optional - only validate if provided
  if (!unit || unit.trim() === '') {
    return; // Unit is optional, no validation needed
  }
  
  // Check if unit is occupied by another active tenant
  if (tenants) {
    const occupiedBy = tenants.find(t => 
      t.unit === unit && 
      t.status === 'active' && 
      t.id !== currentTenantId
    );
    
    if (occupiedBy) {
      throw new ValidationError(`Unit ${unit} is already occupied by ${occupiedBy.name}`);
    }
  }
};
