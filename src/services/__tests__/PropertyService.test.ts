import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PropertyService, type Property } from '../PropertyService';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

// Import the mocked supabase after mocking
import { supabase } from '@/integrations/supabase/client';
const mockSupabase = vi.mocked(supabase);

describe('PropertyService', () => {
  let propertyService: PropertyService;
  let mockQueryBuilder: any;

  beforeEach(() => {
    propertyService = new PropertyService();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create a mock query builder that can be chained
    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn()
    };
    
    // Mock the from method to return our query builder
    mockSupabase.from.mockReturnValue(mockQueryBuilder);
    
    // Mock authentication by default
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { 
        user: { 
          id: 'test-user-id',
          email: 'test@example.com'
        } 
      },
      error: null
    });
  });

  describe('getProperties', () => {
    it('should fetch properties for authenticated user', async () => {
      const mockProperties: Property[] = [
        {
          id: 'property-1',
          landlord_id: 'test-user-id',
          name: 'Test Property',
          address: '123 Test St',
          city: 'Madrid',
          postal_code: '28001',
          country: 'España',
          property_type: 'apartment',
          total_units: 5,
          description: 'Test description',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockQueryBuilder.order.mockResolvedValue({
        data: mockProperties,
        error: null
      });

      const result = await propertyService.getProperties();

      expect(result).toEqual(mockProperties);
      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('landlord_id', 'test-user-id');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should throw error when database query fails', async () => {
      const mockError = new Error('Database error');

      mockQueryBuilder.order.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(propertyService.getProperties()).rejects.toThrow('Database error');
    });

    it('should handle empty results', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await propertyService.getProperties();

      expect(result).toEqual([]);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      await expect(propertyService.getProperties()).rejects.toThrow('User not authenticated');
    });
  });

  describe('createProperty', () => {
    it('should create property with valid data', async () => {
      const propertyData = {
        name: 'New Property',
        address: '456 New St',
        city: 'Barcelona',
        postal_code: '08001',
        property_type: 'house',
        total_units: 3,
        description: 'New property description'
      };

      const mockCreatedProperty: Property = {
        id: 'property-2',
        landlord_id: 'test-user-id',
        ...propertyData,
        country: 'España',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockCreatedProperty,
        error: null
      });

      const result = await propertyService.createProperty(propertyData);

      expect(result).toEqual(mockCreatedProperty);
      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        landlord_id: 'test-user-id',
        name: 'New Property',
        address: '456 New St',
        city: 'Barcelona',
        postal_code: '08001',
        property_type: 'house',
        total_units: 3,
        description: 'New property description',
        country: 'España',
        is_active: true
      }));
    });

    it('should create property with default values when optional fields are missing', async () => {
      const minimalPropertyData = {
        name: 'Minimal Property',
        address: '789 Minimal St',
        city: 'Valencia',
        postal_code: '46001',
        property_type: 'apartment'
      };

      const mockCreatedProperty: Property = {
        id: 'property-3',
        landlord_id: 'test-user-id',
        name: 'Minimal Property',
        address: '789 Minimal St',
        city: 'Valencia',
        postal_code: '46001',
        property_type: 'apartment',
        country: 'España',
        total_units: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockCreatedProperty,
        error: null
      });

      const result = await propertyService.createProperty(minimalPropertyData);

      expect(result).toEqual(mockCreatedProperty);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        total_units: 1,
        country: 'España',
        is_active: true
      }));
    });

    it('should throw error when creation fails', async () => {
      const propertyData = {
        name: 'New Property',
        address: '456 New St',
        city: 'Madrid',
        postal_code: '28001',
        property_type: 'apartment'
      };

      const mockError = new Error('Creation failed');

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(propertyService.createProperty(propertyData)).rejects.toThrow('Creation failed');
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const propertyData = {
        name: 'New Property',
        address: '456 New St',
        city: 'Madrid',
        postal_code: '28001',
        property_type: 'apartment'
      };

      await expect(propertyService.createProperty(propertyData)).rejects.toThrow('User not authenticated');
    });
  });

  describe('updateProperty', () => {
    it('should update property with valid data', async () => {
      const propertyId = 'property-1';
      const updateData = {
        name: 'Updated Property',
        address: '789 Updated St',
        total_units: 8
      };

      const mockUpdatedProperty: Property = {
        id: propertyId,
        landlord_id: 'test-user-id',
        name: 'Updated Property',
        address: '789 Updated St',
        city: 'Madrid',
        postal_code: '28001',
        country: 'España',
        property_type: 'apartment',
        total_units: 8,
        description: 'Test description',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockUpdatedProperty,
        error: null
      });

      const result = await propertyService.updateProperty(propertyId, updateData);

      expect(result).toEqual(mockUpdatedProperty);
      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', propertyId);
    });

    it('should throw error when property not found', async () => {
      const propertyId = 'nonexistent';
      const updateData = { name: 'Updated Property' };

      const mockError = new Error('Property not found');

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(propertyService.updateProperty(propertyId, updateData)).rejects.toThrow('Property not found');
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const propertyId = 'property-1';
      const updateData = { name: 'Updated Property' };

      await expect(propertyService.updateProperty(propertyId, updateData)).rejects.toThrow('User not authenticated');
    });
  });

  describe('deleteProperty', () => {
    it('should delete property successfully when no active tenants', async () => {
      const propertyId = 'property-1';

      // Mock property verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: propertyId, name: 'Test Property' },
        error: null
      });

      // Mock active tenants check (no active tenants)
      const mockTenantsQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
      mockTenantsQueryBuilder.eq.mockResolvedValue({
        data: [],
        error: null
      });
      
      // Mock units deletion
      const mockUnitsQueryBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };
      
      // Mock property deletion
      const mockPropertyDeleteBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      // Set up the from method to return different builders for different tables
      mockSupabase.from
        .mockReturnValueOnce(mockQueryBuilder) // For property verification
        .mockReturnValueOnce(mockTenantsQueryBuilder) // For tenants check
        .mockReturnValueOnce(mockUnitsQueryBuilder) // For units deletion
        .mockReturnValueOnce(mockPropertyDeleteBuilder); // For property deletion

      await expect(propertyService.deleteProperty(propertyId)).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(mockSupabase.from).toHaveBeenCalledWith('tenants');
      expect(mockSupabase.from).toHaveBeenCalledWith('units');
    });

    it('should throw error when property has active tenants', async () => {
      const propertyId = 'property-1';

      // Mock property verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: propertyId, name: 'Test Property' },
        error: null
      });

      // Mock active tenants check (has active tenants)
      const mockTenantsQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
      mockTenantsQueryBuilder.eq.mockResolvedValue({
        data: [{ id: 'tenant-1' }],
        error: null
      });

      mockSupabase.from
        .mockReturnValueOnce(mockQueryBuilder) // For property verification
        .mockReturnValueOnce(mockTenantsQueryBuilder); // For tenants check

      await expect(propertyService.deleteProperty(propertyId))
        .rejects.toThrow('No se puede eliminar una propiedad con inquilinos activos');
    });

    it('should throw error when property not found or no permissions', async () => {
      const propertyId = 'nonexistent';

      // Mock property verification (not found)
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Property not found')
      });

      await expect(propertyService.deleteProperty(propertyId))
        .rejects.toThrow('Propiedad no encontrada o sin permisos');
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const propertyId = 'property-1';

      await expect(propertyService.deleteProperty(propertyId)).rejects.toThrow('User not authenticated');
    });
  });

  describe('authentication and authorization', () => {
    it('should verify user authentication for all operations', async () => {
      const unauthenticatedError = {
        data: { user: null },
        error: new Error('Not authenticated')
      };

      mockSupabase.auth.getUser.mockResolvedValue(unauthenticatedError);

      await expect(propertyService.getProperties()).rejects.toThrow('User not authenticated');
      
      await expect(propertyService.createProperty({
        name: 'Test',
        address: 'Test St',
        city: 'Madrid',
        postal_code: '28001',
        property_type: 'apartment'
      })).rejects.toThrow('User not authenticated');
      
      await expect(propertyService.updateProperty('1', { name: 'Updated' })).rejects.toThrow('User not authenticated');
      
      await expect(propertyService.deleteProperty('1')).rejects.toThrow('User not authenticated');
    });

    it('should filter properties by landlord_id', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: [],
        error: null
      });

      await propertyService.getProperties();

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('landlord_id', 'test-user-id');
    });

    it('should verify property ownership before deletion', async () => {
      const propertyId = 'property-1';

      // Mock property verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: propertyId, name: 'Test Property' },
        error: null
      });

      // Mock active tenants check (no active tenants)
      const mockTenantsQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
      mockTenantsQueryBuilder.eq.mockResolvedValue({
        data: [],
        error: null
      });
      
      // Mock units and property deletion
      const mockDeleteBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockQueryBuilder) // For property verification
        .mockReturnValueOnce(mockTenantsQueryBuilder) // For tenants check
        .mockReturnValueOnce(mockDeleteBuilder) // For units deletion
        .mockReturnValueOnce(mockDeleteBuilder); // For property deletion

      await propertyService.deleteProperty(propertyId);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', propertyId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('landlord_id', 'test-user-id');
    });
  });

  describe('data validation and transformation', () => {
    it('should apply default values during property creation', async () => {
      const propertyData = {
        name: 'Test Property',
        address: '123 Test St',
        city: 'Madrid',
        postal_code: '28001',
        property_type: 'apartment'
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: { id: 'new-property', ...propertyData },
        error: null
      });

      await propertyService.createProperty(propertyData);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        landlord_id: 'test-user-id',
        country: 'España',
        total_units: 1,
        is_active: true
      }));
    });

    it('should handle null values for optional fields', async () => {
      const propertyData = {
        name: 'Test Property',
        address: '123 Test St',
        city: 'Madrid',
        postal_code: '28001',
        property_type: 'apartment',
        description: undefined,
        purchase_price: undefined,
        current_value: undefined,
        purchase_date: undefined
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: { id: 'new-property', ...propertyData },
        error: null
      });

      await propertyService.createProperty(propertyData);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        description: null,
        purchase_price: null,
        current_value: null,
        purchase_date: null
      }));
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockQueryBuilder.order.mockRejectedValue(connectionError);

      await expect(propertyService.getProperties()).rejects.toThrow('Connection failed');
    });

    it('should handle constraint violations during creation', async () => {
      const constraintError = new Error('Constraint violation');
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: constraintError
      });

      const propertyData = {
        name: 'Test Property',
        address: '123 Test St',
        city: 'Madrid',
        postal_code: '28001',
        property_type: 'apartment'
      };

      await expect(propertyService.createProperty(propertyData)).rejects.toThrow('Constraint violation');
    });

    it('should handle tenant check errors during deletion', async () => {
      const propertyId = 'property-1';

      // Mock property verification
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: propertyId, name: 'Test Property' },
        error: null
      });

      // Mock tenant check error
      const mockTenantsQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
      mockTenantsQueryBuilder.eq.mockResolvedValue({
        data: null,
        error: new Error('Tenant check failed')
      });

      mockSupabase.from
        .mockReturnValueOnce(mockQueryBuilder) // For property verification
        .mockReturnValueOnce(mockTenantsQueryBuilder); // For tenants check

      await expect(propertyService.deleteProperty(propertyId))
        .rejects.toThrow('Error al verificar inquilinos activos');
    });
  });
});
