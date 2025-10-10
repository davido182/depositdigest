import { describe, it, expect, beforeEach } from 'vitest';
import { SupabaseTenantService } from '../../services/SupabaseTenantService';
import { 
  testSupabase, 
  cleanupTestData, 
  createTestProperty, 
  createTestUnit,
  createTestTenant 
} from './setup';

describe('Tenant Management Integration Tests', () => {
  let tenantService: SupabaseTenantService;
  let testProperty: any;
  let testUnit: any;

  beforeEach(async () => {
    await cleanupTestData();
    tenantService = new SupabaseTenantService();
    
    // Create test property and unit
    testProperty = await createTestProperty();
    testUnit = await createTestUnit(testProperty.id);
  });

  describe('Tenant CRUD Operations', () => {
    it('should create a new tenant successfully', async () => {
      const tenantData = {
        name: 'Integration Test Tenant',
        email: 'integration@test.com',
        phone: '(555) 123-4567',
        unit: testUnit.unit_number,
        moveInDate: '2024-01-01',
        leaseEndDate: '2024-12-31',
        rentAmount: 1000,
        depositAmount: 500,
        status: 'active' as const,
        propertyId: testProperty.id
      };

      const createdTenant = await tenantService.createTenant(tenantData);

      expect(createdTenant).toBeDefined();
      expect(createdTenant.id).toBeDefined();
      expect(createdTenant.name).toBe(tenantData.name);
      expect(createdTenant.email).toBe(tenantData.email);
      expect(createdTenant.rentAmount).toBe(tenantData.rentAmount);
      expect(createdTenant.status).toBe(tenantData.status);

      // Verify tenant exists in database
      const { data: dbTenant, error } = await testSupabase
        .from('tenants')
        .select('*')
        .eq('id', createdTenant.id)
        .single();

      expect(error).toBeNull();
      expect(dbTenant).toBeDefined();
      expect(dbTenant.name).toBe(tenantData.name);
    });

    it('should retrieve all tenants for authenticated user', async () => {
      // Create multiple test tenants
      const tenant1 = await createTestTenant({ name: 'Test Tenant 1' });
      const tenant2 = await createTestTenant({ name: 'Test Tenant 2' });

      const tenants = await tenantService.getTenants();

      expect(tenants).toBeDefined();
      expect(tenants.length).toBeGreaterThanOrEqual(2);
      
      const tenantNames = tenants.map(t => t.name);
      expect(tenantNames).toContain('Test Tenant 1');
      expect(tenantNames).toContain('Test Tenant 2');
    });

    it('should update tenant information correctly', async () => {
      const tenant = await createTestTenant({ name: 'Original Name' });

      const updateData = {
        name: 'Updated Name',
        email: 'updated@test.com',
        rentAmount: 1200
      };

      const updatedTenant = await tenantService.updateTenant(tenant.id, updateData);

      expect(updatedTenant.name).toBe(updateData.name);
      expect(updatedTenant.email).toBe(updateData.email);
      expect(updatedTenant.rentAmount).toBe(updateData.rentAmount);

      // Verify update in database
      const { data: dbTenant, error } = await testSupabase
        .from('tenants')
        .select('*')
        .eq('id', tenant.id)
        .single();

      expect(error).toBeNull();
      expect(dbTenant.name).toBe(updateData.name);
      expect(dbTenant.email).toBe(updateData.email);
      expect(dbTenant.rent_amount).toBe(updateData.rentAmount);
    });

    it('should delete tenant successfully', async () => {
      const tenant = await createTestTenant();

      const result = await tenantService.deleteTenant(tenant.id);

      expect(result).toBe(true);

      // Verify tenant is deleted from database
      const { data: dbTenant, error } = await testSupabase
        .from('tenants')
        .select('*')
        .eq('id', tenant.id)
        .single();

      expect(dbTenant).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe('Tenant-Unit Relationships', () => {
    it('should assign tenant to unit correctly', async () => {
      const tenantData = {
        name: 'Unit Assignment Test',
        email: 'unit-test@example.com',
        phone: '(555) 123-4567',
        unit: testUnit.unit_number,
        moveInDate: '2024-01-01',
        leaseEndDate: '2024-12-31',
        rentAmount: 1000,
        depositAmount: 500,
        status: 'active' as const,
        propertyId: testProperty.id
      };

      const tenant = await tenantService.createTenant(tenantData);

      // Verify unit is marked as occupied
      const { data: updatedUnit, error } = await testSupabase
        .from('units')
        .select('*')
        .eq('id', testUnit.id)
        .single();

      expect(error).toBeNull();
      expect(updatedUnit.is_available).toBe(false);
      expect(updatedUnit.tenant_id).toBe(tenant.id);
    });

    it('should free unit when tenant is deleted', async () => {
      // First assign tenant to unit
      const tenant = await createTestTenant();
      
      await testSupabase
        .from('units')
        .update({ tenant_id: tenant.id, is_available: false })
        .eq('id', testUnit.id);

      // Delete tenant
      await tenantService.deleteTenant(tenant.id);

      // Verify unit is available again
      const { data: updatedUnit, error } = await testSupabase
        .from('units')
        .select('*')
        .eq('id', testUnit.id)
        .single();

      expect(error).toBeNull();
      expect(updatedUnit.is_available).toBe(true);
      expect(updatedUnit.tenant_id).toBeNull();
    });
  });

  describe('Data Validation and Constraints', () => {
    it('should enforce unique email constraint', async () => {
      const tenant1 = await createTestTenant({ email: 'unique@test.com' });

      const duplicateData = {
        name: 'Duplicate Email Test',
        email: 'unique@test.com', // Same email
        phone: '(555) 987-6543',
        unit: 'Test-102',
        moveInDate: '2024-01-01',
        leaseEndDate: '2024-12-31',
        rentAmount: 1000,
        depositAmount: 500,
        status: 'active' as const
      };

      await expect(tenantService.createTenant(duplicateData))
        .rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Empty name
        email: 'test@example.com',
        phone: '(555) 123-4567',
        unit: 'Test-101',
        moveInDate: '2024-01-01',
        leaseEndDate: '2024-12-31',
        rentAmount: 1000,
        depositAmount: 500,
        status: 'active' as const
      };

      await expect(tenantService.createTenant(invalidData))
        .rejects.toThrow();
    });

    it('should validate date formats and logic', async () => {
      const invalidDateData = {
        name: 'Date Test Tenant',
        email: 'date-test@example.com',
        phone: '(555) 123-4567',
        unit: 'Test-101',
        moveInDate: '2024-12-31',
        leaseEndDate: '2024-01-01', // End date before start date
        rentAmount: 1000,
        depositAmount: 500,
        status: 'active' as const
      };

      await expect(tenantService.createTenant(invalidDateData))
        .rejects.toThrow();
    });

    it('should validate rent amount is positive', async () => {
      const invalidRentData = {
        name: 'Negative Rent Test',
        email: 'negative-rent@example.com',
        phone: '(555) 123-4567',
        unit: 'Test-101',
        moveInDate: '2024-01-01',
        leaseEndDate: '2024-12-31',
        rentAmount: -100, // Negative rent
        depositAmount: 500,
        status: 'active' as const
      };

      await expect(tenantService.createTenant(invalidRentData))
        .rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Create a service with invalid connection
      const invalidService = new SupabaseTenantService();
      
      // Mock the supabase client to simulate connection error
      const originalFrom = testSupabase.from;
      testSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(new Error('Connection failed'))
        })
      });

      await expect(invalidService.getTenants())
        .rejects.toThrow('Connection failed');

      // Restore original method
      testSupabase.from = originalFrom;
    });

    it('should handle non-existent tenant updates', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await expect(tenantService.updateTenant(nonExistentId, { name: 'Updated' }))
        .rejects.toThrow();
    });

    it('should handle non-existent tenant deletions', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await expect(tenantService.deleteTenant(nonExistentId))
        .rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk tenant operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create multiple tenants
      const tenantPromises = Array.from({ length: 10 }, (_, i) => 
        createTestTenant({ 
          name: `Bulk Test Tenant ${i}`,
          email: `bulk-${i}@test.com`
        })
      );

      const tenants = await Promise.all(tenantPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(tenants).toHaveLength(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should retrieve large tenant lists efficiently', async () => {
      // Create multiple tenants first
      await Promise.all(
        Array.from({ length: 20 }, (_, i) => 
          createTestTenant({ 
            name: `Performance Test Tenant ${i}`,
            email: `perf-${i}@test.com`
          })
        )
      );

      const startTime = Date.now();
      const tenants = await tenantService.getTenants();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(tenants.length).toBeGreaterThanOrEqual(20);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});