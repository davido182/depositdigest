
import { MaintenanceRequest } from '@/types';

class MaintenanceService {
  private static instance: MaintenanceService;
  private maintenanceRequests: MaintenanceRequest[] = [];

  private constructor() {
    this.loadMockData();
  }

  public static getInstance(): MaintenanceService {
    if (!MaintenanceService.instance) {
      MaintenanceService.instance = new MaintenanceService();
    }
    return MaintenanceService.instance;
  }

  private loadMockData(): void {
    const mockRequests: MaintenanceRequest[] = [
      {
        id: 'maint-1',
        tenantId: 'tenant-1',
        unit: '101',
        title: 'Fuga en el baño',
        description: 'Hay una pequeña fuga en la tubería del lavabo',
        category: 'plumbing',
        priority: 'high',
        status: 'pending',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'maint-2',
        tenantId: 'tenant-2',
        unit: '203',
        title: 'Problema eléctrico',
        description: 'Se va la luz en la cocina frecuentemente',
        category: 'electrical',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: 'Electricista Juan',
        createdAt: '2024-01-14T14:30:00Z',
        updatedAt: '2024-01-16T09:15:00Z'
      }
    ];

    this.maintenanceRequests = mockRequests;
  }

  public async testConnection(): Promise<boolean> {
    return true;
  }

  public async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return this.maintenanceRequests;
  }

  public async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
    return this.maintenanceRequests.find(request => request.id === id) || null;
  }

  public async getMaintenanceRequestsByTenant(tenantId: string): Promise<MaintenanceRequest[]> {
    return this.maintenanceRequests.filter(request => request.tenantId === tenantId);
  }

  public async createMaintenanceRequest(request: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newRequest: MaintenanceRequest = {
      id: `maint-${Date.now()}`,
      ...request,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.maintenanceRequests.push(newRequest);
    return newRequest.id;
  }

  public async updateMaintenanceRequest(id: string, updates: Partial<MaintenanceRequest>): Promise<boolean> {
    const index = this.maintenanceRequests.findIndex(request => request.id === id);
    if (index === -1) return false;

    this.maintenanceRequests[index] = {
      ...this.maintenanceRequests[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return true;
  }

  public async deleteMaintenanceRequest(id: string): Promise<boolean> {
    const index = this.maintenanceRequests.findIndex(request => request.id === id);
    if (index === -1) return false;

    this.maintenanceRequests.splice(index, 1);
    return true;
  }
}

export default MaintenanceService;
