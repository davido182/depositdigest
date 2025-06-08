import { Tenant, Payment, MaintenanceRequest, Account, AccountingEntry, TaxEntry } from "@/types";
import TenantService from "./TenantService";
import PaymentService from "./PaymentService";
import MaintenanceService from "./MaintenanceService";
import AccountingService from "./AccountingService";

export default class DatabaseService {
  private static instance: DatabaseService;
  private tenantService: TenantService;
  private paymentService: PaymentService;
  private maintenanceService: MaintenanceService;
  private accountingService: AccountingService;
  private totalUnits: number = 9; // Cambiar valor por defecto a 9

  private constructor() {
    this.tenantService = TenantService.getInstance();
    this.paymentService = PaymentService.getInstance();
    this.maintenanceService = MaintenanceService.getInstance();
    this.accountingService = AccountingService.getInstance();
    
    // Cargar unidades guardadas, si no hay nada usar 9 como default
    const savedUnits = localStorage.getItem('totalUnits');
    if (savedUnits) {
      this.totalUnits = parseInt(savedUnits, 10);
      console.log(`DatabaseService: Loaded saved unit count: ${this.totalUnits}`);
    } else {
      console.log(`DatabaseService: Using default unit count: ${this.totalUnits}`);
      // Guardar el valor por defecto
      localStorage.setItem('totalUnits', this.totalUnits.toString());
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

  public async getAccounts(): Promise<Account[]> {
    return this.accountingService.getAccounts();
  }

  public async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.accountingService.createAccount(account);
  }

  public async updateAccount(id: string, updates: Partial<Account>): Promise<boolean> {
    return this.accountingService.updateAccount(id, updates);
  }

  public async deleteAccount(id: string): Promise<boolean> {
    return this.accountingService.deleteAccount(id);
  }

  public async getAccountingEntries(): Promise<AccountingEntry[]> {
    return this.accountingService.getAccountingEntries();
  }

  public async createAccountingEntry(entry: Omit<AccountingEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.accountingService.createAccountingEntry(entry);
  }

  public async updateAccountingEntry(id: string, updates: Partial<AccountingEntry>): Promise<boolean> {
    return this.accountingService.updateAccountingEntry(id, updates);
  }

  public async deleteAccountingEntry(id: string): Promise<boolean> {
    return this.accountingService.deleteAccountingEntry(id);
  }

  public async getTaxEntries(): Promise<TaxEntry[]> {
    return this.accountingService.getTaxEntries();
  }

  public async createTaxEntry(entry: Omit<TaxEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.accountingService.createTaxEntry(entry);
  }

  public async updateTaxEntry(id: string, updates: Partial<TaxEntry>): Promise<boolean> {
    return this.accountingService.updateTaxEntry(id, updates);
  }

  public async deleteTaxEntry(id: string): Promise<boolean> {
    return this.accountingService.deleteTaxEntry(id);
  }

  public getTotalUnits(): number {
    return this.totalUnits;
  }

  public setTotalUnits(count: number): void {
    this.totalUnits = count;
    localStorage.setItem('totalUnits', count.toString());
    console.log(`DatabaseService: Updated unit count to ${count}`);
  }
}
