import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseTenantService } from '../SupabaseTenantService';
import { createMockSupabaseClient, mockAuthenticatedUser, mockTenantData } from '../../test/mocks/supabase';
import type { Tenant } from '../../types';

// Mock the supabase client
vi.mock('../../integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient().client,
}));

describe('SupabaseTenantService', () => {
  let service: SupabaseTenantService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new SupabaseTenantService();
    
    // Mock the supabase property on the service
    (service as any).supabase = mockSupabase.client;
    
    // Mock authentication by default
    mockSupabase.mocks.auth.getUser.mockResolvedValue({
      data: { user: mockAuthenticatedUser },
      error: null,
    });
  });

  describe('getTenants', () => {
    it('should fetch tenants for authenticated user', async () => {
      const mockTenants = [mockTenantData];
      
      mockSupabase.mocks.single.mockResolvedValue({ data: mockTenants, error: null });

      const result = await service.getTenants();

      expect(mockSupabase.mocks.from).toHaveBeenCalledWith('tenants');
      expect(mockSupabase.mocks.select).toHaveBeenCalledWith(`
        *,
        properties(name, address)
      `);
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith('landlord_id', mockAuthenticatedUser.id);
      expect(mockSupabase.mocks.order).toHaveBeenCalledWith('created_at', { ascending: false });
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockTenantData.id,
        name: mockTenantData.name,
        email: mockTenantData.email,
        rentAmount: mockTenantData.rent_amount,
        status: mockTenantData.status,
      });
    });

    it('should handle empty tenant list', async () => {
      mockSupabase.mocks.single.mockResolvedValue({ data: [], error: null });

      const result = await service.getTenants();

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const mockError = { message: 'Database error' };
      mockSupabase.mocks.single.mockResolvedValue({ data: null, error: mockError });

      await expect(service.getTenants()).rejects.toThrow('Failed to fetch tenants: Database error');
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.mocks.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      await expect(service.getTenants()).rejects.toThrow('User not authenticated');
    });
  });

  describe('createTenant', () => {
    const newTenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'> = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1987654321',
      unit: '102',
      moveInDate: '2023-02-01',
      leaseEndDate: '2024-02-01',
      rentAmount: 1300,
      depositAmount: 2600,
      status: 'active',
      propertyName: 'Test Property',
      propertyAddress: '123 Test St',
    };

    it('should create a new tenant successfully', async () => {
      const createdTenant = { ...mockTenantData, ...newTenantData };
      mockSupabase.mocks.single.mockResolvedValue({ data: createdTenant, error: null });

      const result = await service.createTenant(newTenantData);

      expect(mockSupabase.mocks.from).toHaveBeenCalledWith('tenants');
      expect(mockSupabase.mocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          landlord_id: mockAuthenticatedUser.id,
          name: newTenantData.name,
          email: newTenantData.email,
          phone: newTenantData.phone,
          rent_amount: newTenantData.rentAmount,
          status: newTenantData.status,
        })
      );
      expect(mockSupabase.mocks.select).toHaveBeenCalledWith(`
        *,
        properties(name, address)
      `);

      expect(result).toMatchObject({
        name: newTenantData.name,
        email: newTenantData.email,
        rentAmount: newTenantData.rentAmount,
        status: newTenantData.status,
      });
    });

    it('should handle creation errors', async () => {
      const mockError = { message: 'Creation failed' };
      mockSupabase.mocks.single.mockResolvedValue({ data: null, error: mockError });

      await expect(service.createTenant(newTenantData)).rejects.toThrow('Failed to create tenant: Creation failed');
    });

    it('should use default values for optional fields', async () => {
      const minimalTenant = {
        name: 'Minimal Tenant',
        email: 'minimal@example.com',
        phone: '',
        unit: '',
        moveInDate: '',
        leaseEndDate: '',
        rentAmount: 0,
        depositAmount: 0,
        status: 'active' as const,
      };

      const createdTenant = { ...mockTenantData, ...minimalTenant };
      mockSupabase.mocks.single.mockResolvedValue({ data: createdTenant, error: null });

      await service.createTenant(minimalTenant);

      expect(mockSupabase.mocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          landlord_id: mockAuthenticatedUser.id,
          name: minimalTenant.name,
          email: minimalTenant.email,
          phone: null, // Empty string should become null
          rent_amount: 0,
          depositAmount: 0,
          status: 'active',
        })
      );
    });
  });

  describe('updateTenant', () => {
    const tenantId = 'tenant-1';
    const updateData: Partial<Tenant> = {
      name: 'Updated Name',
      rentAmount: 1400,
      status: 'late',
    };

    it('should update tenant successfully', async () => {
      const updatedTenant = { ...mockTenantData, ...updateData };
      mockSupabase.mocks.single.mockResolvedValue({ data: updatedTenant, error: null });

      const result = await service.updateTenant(tenantId, updateData);

      expect(mockSupabase.mocks.from).toHaveBeenCalledWith('tenants');
      expect(mockSupabase.mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: updateData.name,
          rent_amount: updateData.rentAmount,
          status: updateData.status,
        })
      );
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith('id', tenantId);
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith('landlord_id', mockAuthenticatedUser.id);

      expect(result).toMatchObject({
        name: updateData.name,
        rentAmount: updateData.rentAmount,
        status: updateData.status,
      });
    });

    it('should handle update errors', async () => {
      const mockError = { message: 'Update failed' };
      mockSupabase.mocks.single.mockResolvedValue({ data: null, error: mockError });

      await expect(service.updateTenant(tenantId, updateData)).rejects.toThrow('Failed to update tenant: Update failed');
    });

    it('should only update provided fields', async () => {
      const partialUpdate = { name: 'New Name Only' };
      const updatedTenant = { ...mockTenantData, name: partialUpdate.name };
      mockSupabase.mocks.single.mockResolvedValue({ data: updatedTenant, error: null });

      await service.updateTenant(tenantId, partialUpdate);

      expect(mockSupabase.mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: partialUpdate.name,
        })
      );
      
      // Should not include undefined fields
      const updateCall = mockSupabase.mocks.update.mock.calls[0][0];
      expect(updateCall).not.toHaveProperty('rent_amount');
      expect(updateCall).not.toHaveProperty('status');
    });
  });

  describe('deleteTenant', () => {
    const tenantId = 'tenant-1';

    it('should delete tenant successfully', async () => {
      mockSupabase.mocks.delete.mockResolvedValue({ error: null });

      const result = await service.deleteTenant(tenantId);

      expect(mockSupabase.mocks.from).toHaveBeenCalledWith('tenants');
      expect(mockSupabase.mocks.delete).toHaveBeenCalled();
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith('id', tenantId);
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith('landlord_id', mockAuthenticatedUser.id);
      expect(result).toBe(true);
    });

    it('should handle deletion errors', async () => {
      const mockError = { message: 'Deletion failed' };
      mockSupabase.mocks.delete.mockResolvedValue({ error: mockError });

      await expect(service.deleteTenant(tenantId)).rejects.toThrow('Failed to delete tenant: Deletion failed');
    });
  });

  describe('assignTenantToUnit', () => {
    it('should assign tenant to unit successfully', async () => {
      const tenantId = 'tenant-1';
      const unitNumber = '101';
      const propertyId = 'property-1';

      mockSupabase.mocks.update.mockResolvedValue({ error: null });

      // Call the private method through reflection for testing
      await (service as any).assignTenantToUnit(tenantId, unitNumber, propertyId);

      expect(mockSupabase.mocks.from).toHaveBeenCalledWith('units');
      expect(mockSupabase.mocks.update).toHaveBeenCalledWith({
        tenant_id: tenantId,
        is_available: false,
      });
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith('unit_number', unitNumber);
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith('property_id', propertyId);
    });

    it('should handle assignment errors gracefully', async () => {
      const tenantId = 'tenant-1';
      const unitNumber = '101';
      const propertyId = 'property-1';

      const mockError = { message: 'Assignment failed' };
      mockSupabase.mocks.update.mockResolvedValue({ error: mockError });

      // Should not throw error, just log it
      await expect((service as any).assignTenantToUnit(tenantId, unitNumber, propertyId)).resolves.not.toThrow();
    });

    it('should skip assignment for empty unit number', async () => {
      const tenantId = 'tenant-1';
      const unitNumber = '';
      const propertyId = 'property-1';

      await (service as any).assignTenantToUnit(tenantId, unitNumber, propertyId);

      expect(mockSupabase.mocks.from).not.toHaveBeenCalled();
    });
  });

  describe('unassignTenantFromUnit', () => {
    it('should unassign tenant from unit successfully', async () => {
      const tenantId = 'tenant-1';

      mockSupabase.mocks.update.mockResolvedValue({ error: null });

      await (service as any).unassignTenantFromUnit(tenantId);

      expect(mockSupabase.mocks.from).toHaveBeenCalledWith('units');
      expect(mockSupabase.mocks.update).toHaveBeenCalledWith({
        tenant_id: null,
        is_available: true,
      });
      expect(mockSupabase.mocks.eq).toHaveBeenCalledWith('tenant_id', tenantId);
    });

    it('should handle unassignment errors gracefully', async () => {
      const tenantId = 'tenant-1';
      const mockError = { message: 'Unassignment failed' };
      mockSupabase.mocks.update.mockResolvedValue({ error: mockError });

      // Should not throw error, just log it
      await expect((service as any).unassignTenantFromUnit(tenantId)).resolves.not.toThrow();
    });
  });
});