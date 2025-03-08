
import BaseService from './BaseService';
import { MaintenanceRequest } from '@/types';
import { mockMaintenanceRequests } from './mockData';
import { isDemoMode } from '../config/database';

class MaintenanceService extends BaseService {
  private static instance: MaintenanceService;

  private constructor() {
    super();
  }

  public static getInstance(): MaintenanceService {
    if (!MaintenanceService.instance) {
      MaintenanceService.instance = new MaintenanceService();
    }
    return MaintenanceService.instance;
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
        return mockMaintenanceRequests as unknown as T;
      } else if (endpoint.startsWith('maintenance/') && method === 'GET') {
        const id = endpoint.split('/')[1];
        const request = mockMaintenanceRequests.find(r => r.id === id);
        return (request || null) as unknown as T;
      } else if (endpoint.startsWith('maintenance?tenantId=') && method === 'GET') {
        const tenantId = endpoint.split('=')[1];
        const requests = mockMaintenanceRequests.filter(r => r.tenantId === tenantId);
        return requests as unknown as T;
      } else if (endpoint === 'maintenance' && method === 'POST') {
        return { id: crypto.randomUUID() } as unknown as T;
      } else if (endpoint.startsWith('maintenance/') && method === 'PUT') {
        return true as unknown as T;
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
