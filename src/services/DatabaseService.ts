import { Tenant, Payment, MaintenanceRequest } from "@/types";
import TenantService from "./TenantService";
import PaymentService from "./PaymentService";
import MaintenanceService from "./MaintenanceService";

export default class DatabaseService {
  private static instance: DatabaseService;
  private tenantService: TenantService;
  private paymentService: PaymentService;
  private maintenanceService: MaintenanceService;
  private totalUnits: number = 20; // Default value

  private constructor() {
    this.tenantService = new TenantService();
    this.paymentService = new PaymentService();
    this.maintenanceService = new MaintenanceService();
    
    // Load saved total units from localStorage
    const savedUnits = localStorage.getItem('totalUnits');
    if (savedUnits) {
      this.totalUnits = parseInt(savedUnits, 10);
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async testConnection(): Promise<boolean> {
    return true;
  }

  public async getTenants(): Promise<Tenant[]> {
    return this.tenantService.getTenants();
  }

  public async getTenantById(id: string): Promise<Tenant | undefined> {
    return this.tenantService.getTenantById(id);
  }

  public async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' >): Promise<string> {
    return this.tenantService.createTenant(tenant);
  }

  public async updateTenant(id: string, updates: Partial<Tenant>): Promise<boolean> {
    return this.tenantService.updateTenant(id, updates);
  }

  public async deleteTenant(id: string): Promise<boolean> {
    return this.tenantService.deleteTenant(id);
  }

  public async getPayments(): Promise<Payment[]> {
    return this.paymentService.getPayments();
  }

  public async getPaymentById(id: string): Promise<Payment | undefined> {
    return this.paymentService.getPaymentById(id);
  }

  public async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
    return this.paymentService.createPayment(payment);
  }

  public async updatePayment(id: string, updates: Partial<Payment>): Promise<boolean> {
    return this.paymentService.updatePayment(id, updates);
  }

  public async deletePayment(id: string): Promise<boolean> {
    return this.paymentService.deletePayment(id);
  }

  public async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return this.maintenanceService.getMaintenanceRequests();
  }

  public async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | undefined> {
    return this.maintenanceService.getMaintenanceRequestById(id);
  }

  public async createMaintenanceRequest(request: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt' >): Promise<string> {
    return this.maintenanceService.createMaintenanceRequest(request);
  }

  public async updateMaintenanceRequest(id: string, updates: Partial<MaintenanceRequest>): Promise<boolean> {
    return this.maintenanceService.updateMaintenanceRequest(id, updates);
  }

  public async deleteMaintenanceRequest(id: string): Promise<boolean> {
    return this.maintenanceService.deleteMaintenanceRequest(id);
  }

  public getTotalUnits(): number {
    return this.totalUnits;
  }

  public setTotalUnits(count: number): void {
    this.totalUnits = count;
    localStorage.setItem('totalUnits', count.toString());
  }
}
