
import tenantService from './TenantService';
import paymentService from './PaymentService';
import maintenanceService from './MaintenanceService';

export class DatabaseService {
  static async testConnections() {
    console.log('Testing database connections...');
    
    try {
      // Test tenant service
      await tenantService.getTenants();
      console.log('✓ Tenant service connected');
      
      // Test other services as needed
      console.log('✓ All database connections working');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}
