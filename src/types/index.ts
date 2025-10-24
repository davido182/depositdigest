
// Tenant Types - Matching REAL database schema from Supabase types
export interface Tenant {
  id: string;
  user_id: string; // Database field (required)
  landlord_id: string | null; // Database field
  name: string;
  email: string;
  phone: string | null;
  lease_start_date: string; // Database field (required)
  lease_end_date: string | null; // Database field
  rent_amount: number; // Database field
  status: string; // Database field
  unit_number: string; // Database field (required)
  property_id: string | null; // Database field
  property_name: string | null; // Database field
  created_at: string;
  updated_at: string;

  // Frontend-only computed fields
  paymentHistory?: Payment[];
  propertyAddress?: string; // Computed from property relationship

  // Legacy aliases for backward compatibility (for forms)
  moveInDate?: string; // Alias for lease_start_date
  leaseEndDate?: string; // Alias for lease_end_date
  unit?: string; // Alias for unit_number
  rentAmount?: number; // Alias for rent_amount
  depositAmount?: number; // Legacy field - not in DB
  createdAt?: string; // Alias for created_at
  updatedAt?: string; // Alias for updated_at
  landlordId?: string; // Alias for landlord_id
  notes?: string; // Legacy field - not in DB
  propertyName?: string; // Alias for property_name
}

export type TenantStatus = 'active' | 'inactive' | 'late' | 'notice';

// Unit Types - Matching REAL database schema from migration
export interface Unit {
  id: string;
  property_id: string; // Database field (required)
  unit_number: string; // Database field (required)
  tenant_id: string | null; // Database field (nullable)
  monthly_rent: number | null; // Database field (nullable) - REAL field name!
  is_available: boolean; // Database field
  bedrooms?: number; // Database field
  bathrooms?: number; // Database field
  square_meters?: number; // Database field
  deposit_amount?: number; // Database field
  is_furnished?: boolean; // Database field
  description?: string; // Database field
  photos?: string[]; // Database field
  created_at: string;
  updated_at: string;

  // Tenant information (from joins)
  tenant_name?: string | null;
  tenant_email?: string | null;
  tenant_status?: string | null;
  tenants?: {
    id: string;
    name: string;
    email: string;
    status: string;
  } | null;

  // Legacy aliases for backward compatibility
  rent_amount?: number; // Alias for monthly_rent
}

// Property Types - Matching database schema exactly
export interface Property {
  id: string;
  landlord_id: string; // Database field (UUID)
  name: string; // Database field (TEXT)
  address: string | null; // Database field (TEXT, nullable)
  total_units: number | null; // Database field (INTEGER, nullable)
  description: string | null; // Database field (TEXT, nullable)
  created_at: string;
  updated_at: string;
}

// Payment Types
export interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  date: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  month?: number;
  year?: number;
  receipt_file_path?: string;
}

export type PaymentType = 'rent' | 'deposit' | 'fee' | 'other';
export type PaymentMethod = 'cash' | 'check' | 'transfer' | 'card' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Maintenance Request Types
export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  unit: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
}

export type MaintenanceCategory = 'plumbing' | 'electrical' | 'heating' | 'appliance' | 'structural' | 'other';
export type MaintenancePriority = 'emergency' | 'high' | 'medium' | 'low';
export type MaintenanceStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

// Accounting Types - Updated for consistency
export interface AccountingEntry {
  id: string;
  date: string;
  description: string;
  accountId: string;
  debitAmount?: number;
  creditAmount?: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentAccountId?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'income'
  | 'expense';

export interface TaxEntry {
  id: string;
  date: string;
  description: string;
  taxType: TaxType;
  baseAmount: number;
  taxRate: number;
  taxAmount: number;
  status: TaxStatus;
  dueDate?: string;
  paidDate?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaxType =
  | 'municipal_tax'
  | 'fire_department_fee'
  | 'vat'
  | 'income_tax'
  | 'withholding_tax'
  | 'other';

export type TaxStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

// Lease Contract Types
export interface LeaseContract {
  id: string;
  tenantId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface DashboardStats {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  totalTenants: number;
  monthlyRevenue: number;
  overduePayments: number;
  pendingDeposits: number;
  upcomingMoveIns: number;
  upcomingMoveOuts: number;
}

// Aggregated stats interface for useAppData
export interface AggregatedStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyRevenue: number;
  activeTenants: number;
  occupancyRate: number;
  collectionRate: number;
  // Extend to include DashboardStats properties for compatibility
  totalTenants: number;
  overduePayments: number;
  pendingDeposits: number;
  upcomingMoveIns: number;
  upcomingMoveOuts: number;
}
