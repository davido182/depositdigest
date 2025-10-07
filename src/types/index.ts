
// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  moveInDate: string;
  leaseEndDate: string;
  rentAmount: number;
  depositAmount: number;
  status: TenantStatus;
  paymentHistory: Payment[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  landlordId?: string;
  // Información de la propiedad
  propertyName?: string;
  propertyAddress?: string;
}

export type TenantStatus = 'active' | 'inactive' | 'late' | 'notice';

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
