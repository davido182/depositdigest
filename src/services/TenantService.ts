
import BaseService from './BaseService';
import { Tenant } from '@/types';
import { mockTenants } from './mockData';
import { isDemoMode } from '../config/database';

class TenantService extends BaseService {
  // Change from private to protected to match the parent class
  protected static instance: TenantService;

  private constructor() {
    super();
    this.initLocalStorage();
  }

  public static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }
  
  // Make this method public so DatabaseService can call it and pass force parameter
  public initLocalStorage(force: boolean = false): void {
    // Only initialize with mock data if there's no existing data AND we're in demo mode
    if (isDemoMode && (!localStorage.getItem('tenants') || force)) {
      console.log('TenantService: Initializing localStorage with mock tenants data');
      localStorage.setItem('tenants', JSON.stringify(mockTenants));
    } else if (isDemoMode) {
      // Don't reinitialize if data already exists
      const existingTenants = localStorage.getItem('tenants');
      if (existingTenants) {
        console.log('TenantService: Using existing tenant data from localStorage');
      }
    }
  }
  
  private getLocalTenants(): Tenant[] {
    const tenantsJson = localStorage.getItem('tenants');
    if (tenantsJson) {
      try {
        return JSON.parse(tenantsJson);
      } catch (error) {
        console.error('Error parsing tenant data:', error);
        return [];
      }
    }
    return [];
  }
  
  private saveLocalTenants(tenants: Tenant[]): void {
    localStorage.setItem('tenants', JSON.stringify(tenants));
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
        // Return from localStorage for persistence
        console.log('TenantService: Retrieving tenants from localStorage');
        const tenants = this.getLocalTenants();
        console.log(`TenantService: Retrieved ${tenants.length} tenants`);
        return tenants as unknown as T;
      } else if (endpoint.startsWith('tenants/') && method === 'GET') {
        const id = endpoint.split('/')[1];
        const tenants = this.getLocalTenants();
        const tenant = tenants.find(t => t.id === id);
        return (tenant || null) as unknown as T;
      } else if (endpoint === 'tenants' && method === 'POST') {
        const newId = crypto.randomUUID();
        const tenants = this.getLocalTenants();
        
        const newTenant: Tenant = {
          ...data,
          id: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        tenants.push(newTenant);
        this.saveLocalTenants(tenants);
        
        return { id: newId } as unknown as T;
      } else if (endpoint.startsWith('tenants/') && method === 'PUT') {
        const id = endpoint.split('/')[1];
        const tenants = this.getLocalTenants();
        const index = tenants.findIndex(t => t.id === id);
        
        if (index !== -1) {
          tenants[index] = {
            ...tenants[index],
            ...data,
            updatedAt: new Date().toISOString(),
          };
          this.saveLocalTenants(tenants);
          return true as unknown as T;
        }
        return false as unknown as T;
      } else if (endpoint.startsWith('tenants/') && method === 'DELETE') {
        const id = endpoint.split('/')[1];
        const tenants = this.getLocalTenants();
        const filteredTenants = tenants.filter(t => t.id !== id);
        
        if (filteredTenants.length < tenants.length) {
          this.saveLocalTenants(filteredTenants);
          return true as unknown as T;
        }
        return false as unknown as T;
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
  
  public async deleteTenant(id: string): Promise<boolean> {
    return this.simulateRequest<boolean>(`tenants/${id}`, 'DELETE');
  }
}

export default TenantService;
