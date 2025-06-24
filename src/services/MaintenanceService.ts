
import { MaintenanceRequest } from '@/types';

class MaintenanceService {
  private static instance: MaintenanceService;
  private maintenanceRequests: MaintenanceRequest[] = [];

  private constructor() {
    this.loadDataFromStorage();
  }

  public static getInstance(): MaintenanceService {
    if (!MaintenanceService.instance) {
      MaintenanceService.instance = new MaintenanceService();
    }
    return MaintenanceService.instance;
  }

  private loadDataFromStorage(): void {
    const storedData = localStorage.getItem('maintenance_requests');
    if (storedData) {
      try {
        this.maintenanceRequests = JSON.parse(storedData);
        console.log(`MaintenanceService: Loaded ${this.maintenanceRequests.length} maintenance requests from storage`);
      } catch (error) {
        console.error('Error parsing maintenance requests data:', error);
        this.maintenanceRequests = [];
      }
    } else {
      console.log('MaintenanceService: No stored data found, starting with empty array');
      this.maintenanceRequests = [];
    }
  }

  private saveDataToStorage(): void {
    localStorage.setItem('maintenance_requests', JSON.stringify(this.maintenanceRequests));
    console.log(`MaintenanceService: Saved ${this.maintenanceRequests.length} maintenance requests to storage`);
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
    this.saveDataToStorage();
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

    this.saveDataToStorage();
    return true;
  }

  public async deleteMaintenanceRequest(id: string): Promise<boolean> {
    const index = this.maintenanceRequests.findIndex(request => request.id === id);
    if (index === -1) return false;

    this.maintenanceRequests.splice(index, 1);
    this.saveDataToStorage();
    return true;
  }

  public clearAllData(): void {
    console.log('MaintenanceService: Clearing all maintenance request data');
    this.maintenanceRequests = [];
    localStorage.removeItem('maintenance_requests');
  }
}

export default MaintenanceService;
