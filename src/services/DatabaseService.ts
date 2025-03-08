
import { dbConfig, isDemoMode } from '../config/database';
import { Tenant, Payment, MaintenanceRequest } from '@/types';

// Mock data for client-side development
const mockTenants: Tenant[] = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    phone: "(555) 123-4567",
    unit: "101",
    moveInDate: "2023-01-15",
    leaseEndDate: "2024-01-15",
    rentAmount: 1500,
    depositAmount: 1500,
    status: "active",
    paymentHistory: [],
    createdAt: "2023-01-10",
    updatedAt: "2023-01-10",
  },
  {
    id: "2",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    phone: "(555) 987-6543",
    unit: "205",
    moveInDate: "2023-03-01",
    leaseEndDate: "2024-03-01",
    rentAmount: 1700,
    depositAmount: 1700,
    status: "active",
    paymentHistory: [],
    createdAt: "2023-02-25",
    updatedAt: "2023-02-25",
  },
  {
    id: "3",
    name: "Michael Chen",
    email: "michael.chen@example.com",
    phone: "(555) 456-7890",
    unit: "310",
    moveInDate: "2022-11-01",
    leaseEndDate: "2023-11-01",
    rentAmount: 1600,
    depositAmount: 1600,
    status: "late",
    paymentHistory: [],
    createdAt: "2022-10-25",
    updatedAt: "2022-10-25",
  },
  {
    id: "4",
    name: "Jessica Rodriguez",
    email: "jessica.rodriguez@example.com",
    phone: "(555) 789-0123",
    unit: "402",
    moveInDate: "2023-02-15",
    leaseEndDate: "2024-02-15",
    rentAmount: 1800,
    depositAmount: 1800,
    status: "notice",
    paymentHistory: [],
    createdAt: "2023-02-10",
    updatedAt: "2023-02-10",
  },
];

const mockPayments: Payment[] = [
  {
    id: "p1",
    tenantId: "1",
    amount: 1500,
    date: "2023-08-01",
    type: "rent",
    method: "transfer",
    status: "completed",
    createdAt: "2023-08-01",
  },
  {
    id: "p2",
    tenantId: "2",
    amount: 1700,
    date: "2023-08-02",
    type: "rent",
    method: "card",
    status: "completed",
    createdAt: "2023-08-02",
  },
  {
    id: "p3",
    tenantId: "3",
    amount: 1600,
    date: "2023-07-28",
    type: "rent",
    method: "transfer",
    status: "pending",
    createdAt: "2023-07-28",
  },
];

const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: "mr1",
    tenantId: "1",
    unit: "101",
    title: "Leaking Faucet",
    description: "The kitchen faucet is leaking water constantly.",
    category: "plumbing",
    priority: "medium",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mr2",
    tenantId: "2",
    unit: "205",
    title: "Broken Heater",
    description: "The central heating is not working.",
    category: "heating",
    priority: "high",
    status: "in_progress",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignedTo: "John Technician"
  }
];

class DatabaseService {
  private static instance: DatabaseService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = dbConfig.apiUrl;
    console.log("DatabaseService initialized with API URL:", this.apiUrl);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Test connection
  public async testConnection(): Promise<boolean> {
    try {
      // In a real app, we would test the API connection here
      console.log('Testing API connection to:', this.apiUrl);
      // For demo purposes, we'll just return true
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  // Simulate API request with mock data or fetch
  private async simulateRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    console.log(`${method} request to ${endpoint}`, data || '');
    
    if (isDemoMode) {
      // Return mock data in demo mode
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      if (endpoint === 'tenants' && method === 'GET') {
        return mockTenants as unknown as T;
      } else if (endpoint.startsWith('tenants/') && method === 'GET') {
        const id = endpoint.split('/')[1];
        const tenant = mockTenants.find(t => t.id === id);
        return (tenant || null) as unknown as T;
      } else if (endpoint === 'payments' && method === 'GET') {
        return mockPayments as unknown as T;
      } else if (endpoint === 'maintenance' && method === 'GET') {
        return mockMaintenanceRequests as unknown as T;
      } else if (endpoint === 'tenants' && method === 'POST') {
        return { id: crypto.randomUUID() } as unknown as T;
      } else if (endpoint.startsWith('tenants/') && method === 'PUT') {
        return true as unknown as T;
      }
      
      throw new Error(`Unhandled endpoint in demo mode: ${method} ${endpoint}`);
    } else {
      // In a real application, we would make actual API calls here
      try {
        const response = await fetch(`${this.apiUrl}/${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: data ? JSON.stringify(data) : undefined,
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    }
  }

  // Tenant methods
  public async getTenants(): Promise<Tenant[]> {
    return this.simulateRequest<Tenant[]>('tenants');
  }

  public async getTenantById(id: string): Promise<Tenant | null> {
    return this.simulateRequest<Tenant | null>(`tenants/${id}`);
  }

  public async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await this.simulateRequest<{ id: string }>('tenants', 'POST', tenant);
    return result.id;
  }

  public async updateTenant(id: string, tenant: Partial<Tenant>): Promise<boolean> {
    return this.simulateRequest<boolean>(`tenants/${id}`, 'PUT', tenant);
  }

  // Payment methods
  public async getPayments(): Promise<Payment[]> {
    return this.simulateRequest<Payment[]>('payments');
  }

  public async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
    const result = await this.simulateRequest<{ id: string }>('payments', 'POST', payment);
    return result.id;
  }

  // Maintenance Request methods
  public async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return this.simulateRequest<MaintenanceRequest[]>('maintenance');
  }

  public async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
    return this.simulateRequest<MaintenanceRequest | null>(`maintenance/${id}`);
  }

  public async getMaintenanceRequestsByTenant(tenantId: string): Promise<MaintenanceRequest[]> {
    return this.simulateRequest<MaintenanceRequest[]>(`maintenance?tenantId=${tenantId}`);
  }

  public async createMaintenanceRequest(request: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await this.simulateRequest<{ id: string }>('maintenance', 'POST', request);
    return result.id;
  }

  public async updateMaintenanceRequest(id: string, request: Partial<MaintenanceRequest>): Promise<boolean> {
    return this.simulateRequest<boolean>(`maintenance/${id}`, 'PUT', request);
  }
}

export default DatabaseService;
