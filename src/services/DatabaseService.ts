
import TenantService from './TenantService';
import PaymentService from './PaymentService';
import MaintenanceService from './MaintenanceService';
import { Tenant, Payment, MaintenanceRequest } from '@/types';

/**
 * DatabaseService acts as a façade for all the individual services.
 * This helps maintain backward compatibility while we transition to a more modular approach.
 */
class DatabaseService {
  private static instance: DatabaseService;
  private tenantService: TenantService;
  private paymentService: PaymentService;
  private maintenanceService: MaintenanceService;
  private totalUnits: number = 30; // Set to 30 units

  private constructor() {
    this.tenantService = TenantService.getInstance();
    this.paymentService = PaymentService.getInstance();
    this.maintenanceService = MaintenanceService.getInstance();
    
    // Try to load saved unit count from localStorage
    const savedUnits = localStorage.getItem('propertyTotalUnits');
    if (savedUnits) {
      this.totalUnits = parseInt(savedUnits, 10);
    } else {
      // If no saved units, set default to 30 and save it
      localStorage.setItem('propertyTotalUnits', this.totalUnits.toString());
    }
    
    // Force reset tenant data to ensure we have all 27 occupied units
    this.resetMockData();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  // New method to reset mock data to initial state
  private resetMockData(): void {
    // Clear any existing tenant data in localStorage
    localStorage.removeItem('tenants');
    localStorage.removeItem('payments');
    localStorage.removeItem('maintenanceRequests');
    
    // Reinitialize services which will load the default mock data
    this.tenantService.initLocalStorage(true);
    this.paymentService.initLocalStorage(true);
    this.maintenanceService.initLocalStorage(true);
  }

  // Test connection
  public async testConnection(): Promise<boolean> {
    return this.tenantService.testConnection();
  }

  // Unit management
  public getTotalUnits(): number {
    return this.totalUnits;
  }
  
  public setTotalUnits(units: number): void {
    this.totalUnits = units;
    localStorage.setItem('propertyTotalUnits', units.toString());
  }

  // Tenant methods
  public async getTenants(): Promise<Tenant[]> {
    return this.tenantService.getTenants();
  }

  public async getTenantById(id: string): Promise<Tenant | null> {
    return this.tenantService.getTenantById(id);
  }

  public async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.tenantService.createTenant(tenant);
  }

  public async updateTenant(id: string, tenant: Partial<Tenant>): Promise<boolean> {
    // Ensure changes are persisted to localStorage in demo mode
    const result = await this.tenantService.updateTenant(id, tenant);
    return result;
  }
  
  public async deleteTenant(id: string): Promise<boolean> {
    return this.tenantService.deleteTenant(id);
  }

  // Payment methods
  public async getPayments(): Promise<Payment[]> {
    return this.paymentService.getPayments();
  }

  public async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
    return this.paymentService.createPayment(payment);
  }
  
  public async updatePayment(id: string, payment: Partial<Payment>): Promise<boolean> {
    return this.paymentService.updatePayment(id, payment);
  }
  
  public async deletePayment(id: string): Promise<boolean> {
    return this.paymentService.deletePayment(id);
  }

  // Maintenance Request methods
  public async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return this.maintenanceService.getMaintenanceRequests();
  }

  public async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
    return this.maintenanceService.getMaintenanceRequestById(id);
  }

  public async getMaintenanceRequestsByTenant(tenantId: string): Promise<MaintenanceRequest[]> {
    return this.maintenanceService.getMaintenanceRequestsByTenant(tenantId);
  }

  public async createMaintenanceRequest(request: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.maintenanceService.createMaintenanceRequest(request);
  }

  public async updateMaintenanceRequest(id: string, request: Partial<MaintenanceRequest>): Promise<boolean> {
    return this.maintenanceService.updateMaintenanceRequest(id, request);
  }
}

export default DatabaseService;
