import BaseService from './BaseService';
import { Tenant } from '@/types';
import { isDemoMode } from '../config/database';
import { ValidationService } from './ValidationService';

class TenantService extends BaseService {
  protected static instance: TenantService;

  private constructor() {
    super();
    this.ensureDataIntegrity();
  }

  public static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }
  
  private ensureDataIntegrity(): void {
    const existingTenants = localStorage.getItem('tenants');
    
    if (!existingTenants) {
      console.log('TenantService: No existing tenant data, starting fresh');
      localStorage.setItem('tenants', JSON.stringify([]));
    } else {
      try {
        const tenants = JSON.parse(existingTenants);
        console.log(`TenantService: Found ${tenants.length} tenants, keeping user data`);
      } catch (error) {
        console.error('TenantService: Error parsing tenant data, clearing localStorage');
        localStorage.setItem('tenants', JSON.stringify([]));
      }
    }
  }
  
  public clearAllData(): void {
    console.log('TenantService: Clearing all tenant data');
    localStorage.removeItem('tenants');
  }
  
  private getLocalTenants(): Tenant[] {
    const tenantsJson = localStorage.getItem('tenants');
    if (tenantsJson) {
      try {
        const tenants = JSON.parse(tenantsJson);
        console.log(`TenantService: Retrieved ${tenants.length} tenants from localStorage`);
        return tenants;
      } catch (error) {
        console.error('Error parsing tenant data:', error);
        return [];
      }
    }
    console.log('TenantService: No tenant data found in localStorage');
    return [];
  }
  
  private saveLocalTenants(tenants: Tenant[]): void {
    localStorage.setItem('tenants', JSON.stringify(tenants));
    console.log(`TenantService: Saved ${tenants.length} tenants to localStorage`);
  }

  private validateTenantData(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>, existingTenants: Tenant[] = []): void {
    const validationService = ValidationService.getInstance();
    validationService.validateTenant(tenant, existingTenants);
  }

  private validateTenantUpdate(tenant: Tenant, existingTenants: Tenant[] = []): void {
    const validationService = ValidationService.getInstance();
    validationService.validateTenantUpdate(tenant, existingTenants);
  }

  // Override simulateRequest for tenant-specific mock data
  protected async simulateRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    console.log(`TenantService: ${method} request to ${endpoint}`, data || '');
    
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (endpoint === 'tenants' && method === 'GET') {
        const tenants = this.getLocalTenants();
        return tenants as unknown as T;
      } else if (endpoint.startsWith('tenants/') && method === 'GET') {
        const id = endpoint.split('/')[1];
        const tenants = this.getLocalTenants();
        const tenant = tenants.find(t => t.id === id);
        return (tenant || null) as unknown as T;
      } else if (endpoint === 'tenants' && method === 'POST') {
        const existingTenants = this.getLocalTenants();
        
        this.validateTenantData(data, existingTenants);
        
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
          const updatedTenant = {
            ...tenants[index],
            ...data,
            updatedAt: new Date().toISOString(),
          };
          
          this.validateTenantUpdate(updatedTenant, tenants);
          
          tenants[index] = updatedTenant;
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
