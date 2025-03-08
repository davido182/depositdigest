
import BaseService from './BaseService';
import { Tenant } from '@/types';
import { mockTenants } from './mockData';
import { isDemoMode } from '../config/database';

class TenantService extends BaseService {
  private static instance: TenantService;

  private constructor() {
    super();
  }

  public static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  // Override simulateRequest for tenant-specific mock data
  protected async simulateRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    console.log(`TenantService: ${method} request to ${endpoint}`, data || '');
    
    if (isDemoMode) {
      // Return mock data in demo mode
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      if (endpoint === 'tenants' && method === 'GET') {
        return mockTenants as unknown as T;
      } else if (endpoint.startsWith('tenants/') && method === 'GET') {
        const id = endpoint.split('/')[1];
        const tenant = mockTenants.find(t => t.id === id);
        return (tenant || null) as unknown as T;
      } else if (endpoint === 'tenants' && method === 'POST') {
        return { id: crypto.randomUUID() } as unknown as T;
      } else if (endpoint.startsWith('tenants/') && method === 'PUT') {
        return true as unknown as T;
      }
      
      throw new Error(`Unhandled endpoint in demo mode: ${method} ${endpoint}`);
    }
    
    return super.simulateRequest<T>(endpoint, method, data);
  }

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
}

export default TenantService;
