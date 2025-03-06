
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
}

export type PaymentType = 'rent' | 'deposit' | 'fee' | 'other';
export type PaymentMethod = 'cash' | 'check' | 'transfer' | 'card' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

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
