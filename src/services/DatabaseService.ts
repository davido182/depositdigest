
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

  private constructor() {
    this.tenantService = TenantService.getInstance();
    this.paymentService = PaymentService.getInstance();
    this.maintenanceService = MaintenanceService.getInstance();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Test connection
  public async testConnection(): Promise<boolean> {
    return this.tenantService.testConnection();
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
    return this.tenantService.updateTenant(id, tenant);
  }

  // Payment methods
  public async getPayments(): Promise<Payment[]> {
    return this.paymentService.getPayments();
  }

  public async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
    return this.paymentService.createPayment(payment);
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
