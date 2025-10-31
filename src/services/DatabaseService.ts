
import tenantService from './TenantService';
import paymentService from './PaymentService';
import maintenanceService from './MaintenanceService';
import accountingService from './AccountingService';

export class DatabaseService {
  private static instance: DatabaseService;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async testConnections() {
    // Removed console.log for security
    
    try {
      // Test tenant service
      await tenantService.getTenants();
      // Removed console.log for security
      
      // Test payment service
      await paymentService.getPayments();
      // Removed console.log for security
      
      // Removed console.log for security
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Alias for backwards compatibility
  async testConnection() {
    return await this.testConnections();
  }

  // Tenant methods
  async getTenants() {
    return await tenantService.getTenants();
  }

  async createTenant(tenant: any) {
    return await tenantService.createTenant(tenant);
  }

  async updateTenant(id: string, tenant: any) {
    return await tenantService.updateTenant(id, tenant);
  }

  async deleteTenant(id: string) {
    return await tenantService.deleteTenant(id);
  }

  // Payment methods
  async getPayments() {
    return await paymentService.getPayments();
  }

  async createPayment(payment: any) {
    return await paymentService.createPayment(payment);
  }

  async updatePayment(id: string, payment: any) {
    return await paymentService.updatePayment(id, payment);
  }

  async deletePayment(id: string) {
    return await paymentService.deletePayment(id);
  }

  // Maintenance methods
  async getMaintenanceRequests() {
    return await maintenanceService.getMaintenanceRequests();
  }

  async createMaintenanceRequest(request: any) {
    return await maintenanceService.createMaintenanceRequest(request);
  }

  async updateMaintenanceRequest(id: string, updates: any) {
    return await maintenanceService.updateMaintenanceRequest(id, updates);
  }

  async deleteMaintenanceRequest(id: string) {
    return await maintenanceService.deleteMaintenanceRequest(id);
  }

  async getMaintenanceRequestsByProperty(propertyId: string) {
    return await maintenanceService.getMaintenanceRequestsByProperty(propertyId);
  }

  async assignProvider(requestId: string, providerId: string, notes?: string, scheduledDate?: string) {
    return await maintenanceService.assignProvider(requestId, providerId, notes, scheduledDate);
  }

  // Accounting methods
  async getAccounts() {
    const accountingInstance = accountingService.getInstance();
    return await accountingInstance.getAccounts();
  }

  async getAccountingEntries() {
    const accountingInstance = accountingService.getInstance();
    return await accountingInstance.getAccountingEntries();
  }

  async createAccount(account: any) {
    const accountingInstance = accountingService.getInstance();
    return await accountingInstance.createAccount(account);
  }

  async createAccountingEntry(entry: any) {
    const accountingInstance = accountingService.getInstance();
    return await accountingInstance.createAccountingEntry(entry);
  }

  // Unit management methods
  private totalUnits: number = 0;

  getTotalUnits(): number {
    const saved = localStorage.getItem('totalUnits');
    return saved ? parseInt(saved, 10) : this.totalUnits;
  }

  setTotalUnits(count: number): void {
    this.totalUnits = count;
    localStorage.setItem('totalUnits', count.toString());
  }
}

// Export both named and default exports for backward compatibility
export default DatabaseService;
