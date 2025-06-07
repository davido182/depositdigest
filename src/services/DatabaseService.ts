
import TenantService from './TenantService';
import PaymentService from './PaymentService';
import MaintenanceService from './MaintenanceService';
import { SupabaseTenantService } from './SupabaseTenantService';
import { SupabasePaymentService } from './SupabasePaymentService';
import { SupabaseAccountingService } from './SupabaseAccountingService';
import { SupabaseMaintenanceService } from './SupabaseMaintenanceService';
import { Tenant, Payment, MaintenanceRequest, Account, AccountingEntry, TaxEntry } from '@/types';
import { supabase } from "@/integrations/supabase/client";

/**
 * DatabaseService acts as a façade for all the individual services.
 * This helps maintain backward compatibility while we transition to a more modular approach.
 */
class DatabaseService {
  private static instance: DatabaseService;
  private tenantService: TenantService;
  private paymentService: PaymentService;
  private maintenanceService: MaintenanceService;
  private supabaseTenantService: SupabaseTenantService;
  private supabasePaymentService: SupabasePaymentService;
  private supabaseAccountingService: SupabaseAccountingService;
  private supabaseMaintenanceService: SupabaseMaintenanceService;
  private totalUnits: number = 30;

  private constructor() {
    this.tenantService = TenantService.getInstance();
    this.paymentService = PaymentService.getInstance();
    this.maintenanceService = MaintenanceService.getInstance();
    this.supabaseTenantService = new SupabaseTenantService();
    this.supabasePaymentService = new SupabasePaymentService();
    this.supabaseAccountingService = new SupabaseAccountingService();
    this.supabaseMaintenanceService = new SupabaseMaintenanceService();
    
    // Try to load saved unit count from localStorage
    const savedUnits = localStorage.getItem('propertyTotalUnits');
    if (savedUnits) {
      this.totalUnits = parseInt(savedUnits, 10);
    } else {
      localStorage.setItem('propertyTotalUnits', this.totalUnits.toString());
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
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

  // Tenant methods - use Supabase if authenticated, otherwise fallback to mock
  public async getTenants(): Promise<Tenant[]> {
    if (await this.isAuthenticated()) {
      return this.supabaseTenantService.getTenants();
    }
    return this.tenantService.getTenants();
  }

  public async getTenantById(id: string): Promise<Tenant | null> {
    if (await this.isAuthenticated()) {
      return this.supabaseTenantService.getTenantById(id);
    }
    return this.tenantService.getTenantById(id);
  }

  public async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (await this.isAuthenticated()) {
      return this.supabaseTenantService.createTenant(tenant);
    }
    return this.tenantService.createTenant(tenant);
  }

  public async updateTenant(id: string, tenant: Partial<Tenant>): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabaseTenantService.updateTenant(id, tenant);
    }
    return this.tenantService.updateTenant(id, tenant);
  }
  
  public async deleteTenant(id: string): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabaseTenantService.deleteTenant(id);
    }
    return this.tenantService.deleteTenant(id);
  }

  // Payment methods - use Supabase if authenticated, otherwise mock service
  public async getPayments(): Promise<Payment[]> {
    if (await this.isAuthenticated()) {
      return this.supabasePaymentService.getPayments();
    }
    return this.paymentService.getPayments();
  }

  public async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
    if (await this.isAuthenticated()) {
      return this.supabasePaymentService.createPayment(payment);
    }
    return this.paymentService.createPayment(payment);
  }
  
  public async updatePayment(id: string, payment: Partial<Payment>): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabasePaymentService.updatePayment(id, payment);
    }
    return this.paymentService.updatePayment(id, payment);
  }
  
  public async deletePayment(id: string): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabasePaymentService.deletePayment(id);
    }
    return this.paymentService.deletePayment(id);
  }

  // Maintenance Request methods - use Supabase if authenticated, otherwise mock service
  public async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    if (await this.isAuthenticated()) {
      return this.supabaseMaintenanceService.getMaintenanceRequests();
    }
    return this.maintenanceService.getMaintenanceRequests();
  }

  public async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
    if (await this.isAuthenticated()) {
      return this.supabaseMaintenanceService.getMaintenanceRequestById(id);
    }
    return this.maintenanceService.getMaintenanceRequestById(id);
  }

  public async getMaintenanceRequestsByTenant(tenantId: string): Promise<MaintenanceRequest[]> {
    if (await this.isAuthenticated()) {
      return this.supabaseMaintenanceService.getMaintenanceRequestsByTenant(tenantId);
    }
    return this.maintenanceService.getMaintenanceRequestsByTenant(tenantId);
  }

  public async createMaintenanceRequest(request: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (await this.isAuthenticated()) {
      return this.supabaseMaintenanceService.createMaintenanceRequest(request);
    }
    return this.maintenanceService.createMaintenanceRequest(request);
  }

  public async updateMaintenanceRequest(id: string, request: Partial<MaintenanceRequest>): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabaseMaintenanceService.updateMaintenanceRequest(id, request);
    }
    return this.maintenanceService.updateMaintenanceRequest(id, request);
  }

  public async deleteMaintenanceRequest(id: string): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabaseMaintenanceService.deleteMaintenanceRequest(id);
    }
    return this.maintenanceService.deleteMaintenanceRequest(id);
  }

  // Accounting methods - new functionality
  public async getAccounts(): Promise<Account[]> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.getAccounts();
    }
    // Return empty array for non-authenticated users
    return [];
  }

  public async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.createAccount(account);
    }
    throw new Error("Authentication required for accounting features");
  }

  public async updateAccount(id: string, account: Partial<Account>): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.updateAccount(id, account);
    }
    throw new Error("Authentication required for accounting features");
  }

  public async deleteAccount(id: string): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.deleteAccount(id);
    }
    throw new Error("Authentication required for accounting features");
  }

  // Accounting Entries methods
  public async getAccountingEntries(): Promise<AccountingEntry[]> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.getAccountingEntries();
    }
    return [];
  }

  public async createAccountingEntry(entry: Omit<AccountingEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.createAccountingEntry(entry);
    }
    throw new Error("Authentication required for accounting features");
  }

  public async updateAccountingEntry(id: string, entry: Partial<AccountingEntry>): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.updateAccountingEntry(id, entry);
    }
    throw new Error("Authentication required for accounting features");
  }

  public async deleteAccountingEntry(id: string): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.deleteAccountingEntry(id);
    }
    throw new Error("Authentication required for accounting features");
  }

  // Tax Entries methods
  public async getTaxEntries(): Promise<TaxEntry[]> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.getTaxEntries();
    }
    return [];
  }

  public async createTaxEntry(entry: Omit<TaxEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.createTaxEntry(entry);
    }
    throw new Error("Authentication required for accounting features");
  }

  public async updateTaxEntry(id: string, entry: Partial<TaxEntry>): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.updateTaxEntry(id, entry);
    }
    throw new Error("Authentication required for accounting features");
  }

  public async deleteTaxEntry(id: string): Promise<boolean> {
    if (await this.isAuthenticated()) {
      return this.supabaseAccountingService.deleteTaxEntry(id);
    }
    throw new Error("Authentication required for accounting features");
  }
}

export default DatabaseService;
