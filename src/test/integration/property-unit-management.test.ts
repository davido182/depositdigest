import { describe, it, expect, beforeEach } from 'vitest';
import { PropertyService } from '../../services/PropertyService';
import { UnitService } from '../../services/UnitService';
import { 
  testSupabase, 
  cleanupTestData, 
  createTestProperty, 
  createTestUnit,
  createTestTenant 
} from './setup';

describe('Property and Unit Management Integration Tests', () => {
  let propertyService: PropertyService;
  let unitService: UnitService;

  beforeEach(async () => {
    await cleanupTestData();
    propertyService = new PropertyService();
    unitService = new UnitService();
  });

  describe('Property CRUD Operations', () => {
    it('should create property with units successfully', async () => {
      const propertyData = {
        name: 'Integration Test Property',
        address: '123 Integration Street',
        total_units: 3,
        description: 'Test property for integration tests'
      };

      const property = await propertyService.createProperty(propertyData);

      expect(property).toBeDefined();
      expect(property.id).toBeDefined();
      expect(property.name).toBe(propertyData.name);
      expect(property.address).toBe(propertyData.address);
      expect(property.total_units).toBe(propertyData.total_units);

      // Verify property exists in database
      const { data: dbProperty, error } = await testSupabase
        .from('properties')
        .select('*')
        .eq('id', property.id)
        .single();

      expect(error).toBeNull();
      expect(dbProperty).toBeDefined();
      expect(dbProperty.name).toBe(propertyData.name);
    });

    it('should retrieve all properties for authenticated user', async () => {
      // Create multiple test properties
      await createTestProperty({ name: 'Test Property 1' });
      await createTestProperty({ name: 'Test Property 2' });

      const properties = await propertyService.getProperties();

      expect(properties).toBeDefined();
      expect(properties.length).toBeGreaterThanOrEqual(2);
      
      const propertyNames = properties.map(p => p.name);
      expect(propertyNames).toContain('Test Property 1');
      expect(propertyNames).toContain('Test Property 2');
    });

    it('should update property information correctly', async () => {
      const property = await createTestProperty({ name: 'Original Property' });

      const updateData = {
        name: 'Updated Property Name',
        address: '456 Updated Street',
        description: 'Updated description'
      };

      const updatedProperty = await propertyService.updateProperty(property.id, updateData);

      expect(updatedProperty.name).toBe(updateData.name);
      expect(updatedProperty.address).toBe(updateData.address);
      expect(updatedProperty.description).toBe(updateData.description);

      // Verify update in database
      const { data: dbProperty, error } = await testSupabase
        .from('properties')
        .select('*')
        .eq('id', property.id)
        .single();

      expect(error).toBeNull();
      expect(dbProperty.name).toBe(updateData.name);
      expect(dbProperty.address).toBe(updateData.address);
    });

    it('should delete property and cascade to units', async () => {
      const property = await createTestProperty();
      const unit = await createTestUnit(property.id);

      const result = await propertyService.deleteProperty(property.id);

      expect(result).toBe(true);

      // Verify property is deleted
      const { data: dbProperty } = await testSupabase
        .from('properties')
        .select('*')
        .eq('id', property.id)
        .single();

      expect(dbProperty).toBeNull();

      // Verify units are also deleted (cascade)
      const { data: dbUnit } = await testSupabase
        .from('units')
        .select('*')
        .eq('id', unit.id)
        .single();

      expect(dbUnit).toBeNull();
    });
  });

  describe('Unit Management Operations', () => {
    let testProperty: any;

    beforeEach(async () => {
      testProperty = await createTestProperty();
    });

    it('should create unit for property successfully', async () => {
      const unitData = {
        property_id: testProperty.id,
        unit_number: 'INT-101',
        monthly_rent: 1200,
        is_available: true
      };

      const unit = await unitService.createUnit(unitData);

      expect(unit).toBeDefined();
      expect(unit.id).toBeDefined();
      expect(unit.unit_number).toBe(unitData.unit_number);
      expect(unit.monthly_rent).toBe(unitData.monthly_rent);
      expect(unit.is_available).toBe(unitData.is_available);

      // Verify unit exists in database
      const { data: dbUnit, error } = await testSupabase
        .from('units')
        .select('*')
        .eq('id', unit.id)
        .single();

      expect(error).toBeNull();
      expect(dbUnit).toBeDefined();
      expect(dbUnit.unit_number).toBe(unitData.unit_number);
    });

    it('should retrieve units by property', async () => {
      // Create multiple units for the property
      await createTestUnit(testProperty.id, { unit_number: 'INT-101' });
      await createTestUnit(testProperty.id, { unit_number: 'INT-102' });

      const units = await unitService.getUnitsByProperty(testProperty.id);

      expect(units).toBeDefined();
      expect(units.length).toBe(2);
      
      const unitNumbers = units.map(u => u.unit_number);
      expect(unitNumbers).toContain('INT-101');
      expect(unitNumbers).toContain('INT-102');
    });

    it('should update unit information correctly', async () => {
      const unit = await createTestUnit(testProperty.id, { monthly_rent: 1000 });

      const updateData = {
        monthly_rent: 1300,
        is_available: false
      };

      const updatedUnit = await unitService.updateUnit(unit.id, updateData);

      expect(updatedUnit.monthly_rent).toBe(updateData.monthly_rent);
      expect(updatedUnit.is_available).toBe(updateData.is_available);

      // Verify update in database
      const { data: dbUnit, error } = await testSupabase
        .from('units')
        .select('*')
        .eq('id', unit.id)
        .single();

      expect(error).toBeNull();
      expect(dbUnit.monthly_rent).toBe(updateData.monthly_rent);
      expect(dbUnit.is_available).toBe(updateData.is_available);
    });

    it('should delete unit successfully', async () => {
      const unit = await createTestUnit(testProperty.id);

      const result = await unitService.deleteUnit(unit.id);

      expect(result).toBe(true);

      // Verify unit is deleted from database
      const { data: dbUnit } = await testSupabase
        .from('units')
        .select('*')
        .eq('id', unit.id)
        .single();

      expect(dbUnit).toBeNull();
    });
  });

  describe('Property-Unit Relationships', () => {
    it('should maintain property-unit relationship integrity', async () => {
      const property = await createTestProperty();
      const unit = await createTestUnit(property.id);

      // Verify relationship exists
      const { data: unitWithProperty, error } = await testSupabase
        .from('units')
        .select(`
          *,
          properties(*)
        `)
        .eq('id', unit.id)
        .single();

      expect(error).toBeNull();
      expect(unitWithProperty.properties).toBeDefined();
      expect(unitWithProperty.properties.id).toBe(property.id);
      expect(unitWithProperty.properties.name).toBe(property.name);
    });

    it('should prevent unit creation for non-existent property', async () => {
      const nonExistentPropertyId = '00000000-0000-0000-0000-000000000000';
      
      const unitData = {
        property_id: nonExistentPropertyId,
        unit_number: 'INVALID-101',
        monthly_rent: 1000,
        is_available: true
      };

      await expect(unitService.createUnit(unitData))
        .rejects.toThrow();
    });

    it('should handle unit availability correctly with tenant assignment', async () => {
      const property = await createTestProperty();
      const unit = await createTestUnit(property.id, { is_available: true });
      const tenant = await createTestTenant();

      // Assign tenant to unit
      await testSupabase
        .from('units')
        .update({ 
          tenant_id: tenant.id, 
          is_available: false 
        })
        .eq('id', unit.id);

      // Verify unit is no longer available
      const { data: updatedUnit, error } = await testSupabase
        .from('units')
        .select('*')
        .eq('id', unit.id)
        .single();

      expect(error).toBeNull();
      expect(updatedUnit.is_available).toBe(false);
      expect(updatedUnit.tenant_id).toBe(tenant.id);

      // Unassign tenant
      await testSupabase
        .from('units')
        .update({ 
          tenant_id: null, 
          is_available: true 
        })
        .eq('id', unit.id);

      // Verify unit is available again
      const { data: availableUnit, error: availableError } = await testSupabase
        .from('units')
        .select('*')
        .eq('id', unit.id)
        .single();

      expect(availableError).toBeNull();
      expect(availableUnit.is_available).toBe(true);
      expect(availableUnit.tenant_id).toBeNull();
    });
  });

  describe('Data Validation and Constraints', () => {
    it('should enforce unique unit numbers within property', async () => {
      const property = await createTestProperty();
      
      // Create first unit
      await createTestUnit(property.id, { unit_number: 'UNIQUE-101' });

      // Try to create second unit with same number
      await expect(
        createTestUnit(property.id, { unit_number: 'UNIQUE-101' })
      ).rejects.toThrow();
    });

    it('should allow same unit numbers across different properties', async () => {
      const property1 = await createTestProperty({ name: 'Property 1' });
      const property2 = await createTestProperty({ name: 'Property 2' });

      // Create units with same number in different properties
      const unit1 = await createTestUnit(property1.id, { unit_number: 'SAME-101' });
      const unit2 = await createTestUnit(property2.id, { unit_number: 'SAME-101' });

      expect(unit1.unit_number).toBe('SAME-101');
      expect(unit2.unit_number).toBe('SAME-101');
      expect(unit1.property_id).toBe(property1.id);
      expect(unit2.property_id).toBe(property2.id);
    });

    it('should validate property required fields', async () => {
      const invalidPropertyData = {
        name: '', // Empty name
        address: '123 Test St',
        total_units: 1,
        description: 'Test'
      };

      await expect(propertyService.createProperty(invalidPropertyData))
        .rejects.toThrow();
    });

    it('should validate unit required fields', async () => {
      const property = await createTestProperty();
      
      const invalidUnitData = {
        property_id: property.id,
        unit_number: '', // Empty unit number
        monthly_rent: 1000,
        is_available: true
      };

      await expect(unitService.createUnit(invalidUnitData))
        .rejects.toThrow();
    });

    it('should validate positive rent amounts', async () => {
      const property = await createTestProperty();
      
      const invalidUnitData = {
        property_id: property.id,
        unit_number: 'NEG-101',
        monthly_rent: -100, // Negative rent
        is_available: true
      };

      await expect(unitService.createUnit(invalidUnitData))
        .rejects.toThrow();
    });
  });

  describe('Complex Property Operations', () => {
    it('should handle property with multiple units and tenants', async () => {
      const property = await createTestProperty({ total_units: 3 });
      
      // Create units
      const unit1 = await createTestUnit(property.id, { unit_number: 'MULTI-101' });
      const unit2 = await createTestUnit(property.id, { unit_number: 'MULTI-102' });
      const unit3 = await createTestUnit(property.id, { unit_number: 'MULTI-103' });

      // Create tenants and assign to units
      const tenant1 = await createTestTenant({ name: 'Tenant 1' });
      const tenant2 = await createTestTenant({ name: 'Tenant 2' });

      // Assign tenants to units
      await testSupabase
        .from('units')
        .update({ tenant_id: tenant1.id, is_available: false })
        .eq('id', unit1.id);

      await testSupabase
        .from('units')
        .update({ tenant_id: tenant2.id, is_available: false })
        .eq('id', unit2.id);

      // Verify property with units and tenants
      const { data: propertyWithUnits, error } = await testSupabase
        .from('properties')
        .select(`
          *,
          units(
            *,
            tenants(name, email)
          )
        `)
        .eq('id', property.id)
        .single();

      expect(error).toBeNull();
      expect(propertyWithUnits.units).toHaveLength(3);
      
      const occupiedUnits = propertyWithUnits.units.filter((u: any) => !u.is_available);
      const availableUnits = propertyWithUnits.units.filter((u: any) => u.is_available);
      
      expect(occupiedUnits).toHaveLength(2);
      expect(availableUnits).toHaveLength(1);
    });

    it('should calculate property statistics correctly', async () => {
      const property = await createTestProperty({ total_units: 4 });
      
      // Create units with different rent amounts
      await createTestUnit(property.id, { unit_number: 'STAT-101', monthly_rent: 1000, is_available: false });
      await createTestUnit(property.id, { unit_number: 'STAT-102', monthly_rent: 1200, is_available: false });
      await createTestUnit(property.id, { unit_number: 'STAT-103', monthly_rent: 1100, is_available: true });
      await createTestUnit(property.id, { unit_number: 'STAT-104', monthly_rent: 1300, is_available: true });

      const units = await unitService.getUnitsByProperty(property.id);

      // Calculate statistics
      const totalUnits = units.length;
      const occupiedUnits = units.filter(u => !u.is_available).length;
      const availableUnits = units.filter(u => u.is_available).length;
      const occupancyRate = (occupiedUnits / totalUnits) * 100;
      const totalPotentialRevenue = units.reduce((sum, u) => sum + (u.monthly_rent || 0), 0);
      const currentRevenue = units
        .filter(u => !u.is_available)
        .reduce((sum, u) => sum + (u.monthly_rent || 0), 0);

      expect(totalUnits).toBe(4);
      expect(occupiedUnits).toBe(2);
      expect(availableUnits).toBe(2);
      expect(occupancyRate).toBe(50);
      expect(totalPotentialRevenue).toBe(4600); // 1000 + 1200 + 1100 + 1300
      expect(currentRevenue).toBe(2200); // 1000 + 1200
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk property operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create multiple properties
      const propertyPromises = Array.from({ length: 5 }, (_, i) => 
        createTestProperty({ 
          name: `Bulk Property ${i}`,
          address: `${i} Bulk Street`
        })
      );

      const properties = await Promise.all(propertyPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(properties).toHaveLength(5);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle bulk unit creation efficiently', async () => {
      const property = await createTestProperty();
      const startTime = Date.now();
      
      // Create multiple units
      const unitPromises = Array.from({ length: 10 }, (_, i) => 
        createTestUnit(property.id, { 
          unit_number: `BULK-${i + 101}`,
          monthly_rent: 1000 + (i * 100)
        })
      );

      const units = await Promise.all(unitPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(units).toHaveLength(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
