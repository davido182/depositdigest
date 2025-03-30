
import BaseService from './BaseService';
import { MaintenanceRequest } from '@/types';
import { mockMaintenanceRequests } from './mockData';
import { isDemoMode } from '../config/database';

class MaintenanceService extends BaseService {
  // Change from private to protected to match the parent class
  protected static instance: MaintenanceService;

  private constructor() {
    super();
    this.initLocalStorage();
  }

  public static getInstance(): MaintenanceService {
    if (!MaintenanceService.instance) {
      MaintenanceService.instance = new MaintenanceService();
    }
    return MaintenanceService.instance;
  }
  
  // Add public initLocalStorage method to match TenantService
  public initLocalStorage(force: boolean = false): void {
    if ((isDemoMode && !localStorage.getItem('maintenanceRequests')) || force) {
      console.log('MaintenanceService: Initializing localStorage with mock maintenance requests data');
      localStorage.setItem('maintenanceRequests', JSON.stringify(mockMaintenanceRequests));
    }
  }

  // Override simulateRequest for maintenance-specific mock data
  protected async simulateRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    console.log(`MaintenanceService: ${method} request to ${endpoint}`, data || '');
    
    if (isDemoMode) {
      // Return mock data in demo mode
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      if (endpoint === 'maintenance' && method === 'GET') {
        const maintenanceJson = localStorage.getItem('maintenanceRequests');
        const maintenanceRequests = maintenanceJson ? JSON.parse(maintenanceJson) : mockMaintenanceRequests;
        return maintenanceRequests as unknown as T;
      } else if (endpoint.startsWith('maintenance/') && method === 'GET') {
        const id = endpoint.split('/')[1];
        const maintenanceJson = localStorage.getItem('maintenanceRequests');
        const maintenanceRequests = maintenanceJson ? JSON.parse(maintenanceJson) : mockMaintenanceRequests;
        const request = maintenanceRequests.find((r: MaintenanceRequest) => r.id === id);
        return (request || null) as unknown as T;
      } else if (endpoint.startsWith('maintenance?tenantId=') && method === 'GET') {
        const tenantId = endpoint.split('=')[1];
        const maintenanceJson = localStorage.getItem('maintenanceRequests');
        const maintenanceRequests = maintenanceJson ? JSON.parse(maintenanceJson) : mockMaintenanceRequests;
        const requests = maintenanceRequests.filter((r: MaintenanceRequest) => r.tenantId === tenantId);
        return requests as unknown as T;
      } else if (endpoint === 'maintenance' && method === 'POST') {
        const newRequest = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const maintenanceJson = localStorage.getItem('maintenanceRequests');
        const maintenanceRequests = maintenanceJson ? JSON.parse(maintenanceJson) : mockMaintenanceRequests;
        maintenanceRequests.push(newRequest);
        localStorage.setItem('maintenanceRequests', JSON.stringify(maintenanceRequests));
        
        return { id: newRequest.id } as unknown as T;
      } else if (endpoint.startsWith('maintenance/') && method === 'PUT') {
        const id = endpoint.split('/')[1];
        
        const maintenanceJson = localStorage.getItem('maintenanceRequests');
        const maintenanceRequests = maintenanceJson ? JSON.parse(maintenanceJson) : mockMaintenanceRequests;
        const index = maintenanceRequests.findIndex((r: MaintenanceRequest) => r.id === id);
        
        if (index !== -1) {
          maintenanceRequests[index] = {
            ...maintenanceRequests[index],
            ...data,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('maintenanceRequests', JSON.stringify(maintenanceRequests));
          return true as unknown as T;
        }
        return false as unknown as T;
      }
      
      throw new Error(`Unhandled endpoint in demo mode: ${method} ${endpoint}`);
    }
    
    return super.simulateRequest<T>(endpoint, method, data);
  }

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

export default MaintenanceService;
