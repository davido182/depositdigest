import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  async getTenants(): Promise<Tenant[]> {
    console.log('🔍 [SYNC-FIX] Fetching tenants from Supabase...');

    const user = await this.ensureAuthenticated();
    console.log('👤 User authenticated:', user.id);

    // Get tenants with proper error handling
    const { data: tenantsData, error: tenantsError } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('landlord_id', user.id);

    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError);
      throw new Error(`Failed to fetch tenants: ${tenantsError.message}`);
    }

    console.log('✅ Raw tenant data:', tenantsData?.length || 0, 'tenants');

    if (!tenantsData || tenantsData.length === 0) {
      console.log('📭 No tenants found');
      return [];
    }

    // Get units data with safe column selection (avoiding non-existent columns)
    const { data: unitsData, error: unitsError } = await this.supabase
      .from('units')
      .select(`
        id, 
        unit_number, 
        is_available,
        property_id,
        rent_amount,
        properties!inner(
          id,
          name, 
          address,
          user_id
        )
      `)
      .eq('properties.user_id', user.id);

    if (unitsError) {
      console.error('❌ Error fetching units:', unitsError);
      // Continue without units data rather than failing completely
    }

    console.log('✅ [SYNC-FIX] Fetched units:', unitsData?.length || 0);

    // Create a map of tenant assignments from a separate query if needed
    const { data: assignmentsData } = await this.supabase
      .from('tenant_unit_assignments')
      .select('tenant_id, unit_id, unit_number, property_id')
      .in('tenant_id', tenantsData.map(t => t.id));

    console.log('📋 [SYNC-FIX] Tenant assignments:', assignmentsData?.length || 0);

    // Transform tenant data with proper null checks
    return tenantsData
      .filter(tenant => tenant?.name && tenant.name.trim() !== '')
      .map(tenant => {
        const fullName = tenant.name || 'Sin nombre';

        // Find unit assignment for this tenant
        const assignment = assignmentsData?.find(a => a.tenant_id === tenant.id);
        const assignedUnit = unitsData?.find(unit => 
          assignment ? unit.id === assignment.unit_id : false
        );

        const unitNumber = assignment?.unit_number || assignedUnit?.unit_number || null;
        const propertyId = assignment?.property_id || assignedUnit?.property_id || tenant.property_id;
        const propertyName = assignedUnit?.properties?.name || tenant.property_name || null;
        const propertyAddress = assignedUnit?.properties?.address || '';

        console.log(`📋 [SYNC-FIX] Mapping tenant ${fullName}:`, {
          tenantId: tenant.id,
          unit: unitNumber,
          property: propertyName,
          propertyId: propertyId,
          hasAssignment: !!assignment,
          hasUnit: !!assignedUnit
        });

        return {
          id: tenant.id,
          user_id: tenant.landlord_id || '',
          landlord_id: tenant.landlord_id,
          name: fullName,
          email: tenant.email || '',
          phone: tenant.phone || '',
          lease_start_date: tenant.lease_start_date || '',
          lease_end_date: tenant.lease_end_date || '',
          rent_amount: Number(tenant.rent_amount || assignedUnit?.rent_amount || 0),
          status: tenant.status || 'active',
          unit_number: unitNumber || '',
          property_id: propertyId,
          property_name: propertyName || 'Sin propiedad',
          created_at: tenant.created_at,
          updated_at: tenant.updated_at,

          // Legacy aliases for forms (with null safety)
          unit: unitNumber || '',
          moveInDate: tenant.lease_start_date || '',
          leaseEndDate: tenant.lease_end_date || '',
          rentAmount: Number(tenant.rent_amount || assignedUnit?.rent_amount || 0),
          depositAmount: Number(tenant.deposit_amount || 0),
          paymentHistory: [],
          createdAt: tenant.created_at,
          updatedAt: tenant.updated_at,
          propertyName: propertyName || 'Sin propiedad',
          propertyAddress: propertyAddress,
          notes: tenant.notes || '',
        };
      });
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('📝 [SYNC-FIX] Creating tenant in Supabase:', tenant);

    const user = await this.ensureAuthenticated();

    // Prepare insert data with proper validation
    const insertData = {
      landlord_id: user.id,
      name: tenant.name?.trim() || 'Sin nombre',
      email: tenant.email?.trim() || null,
      phone: tenant.phone?.trim() || null,
      lease_start_date: tenant.moveInDate || new Date().toISOString().split('T')[0],
      lease_end_date: tenant.leaseEndDate || null,
      rent_amount: Number(tenant.rentAmount || 0),
      deposit_amount: Number(tenant.depositAmount || 0),
      status: tenant.status || 'active',
      notes: tenant.notes?.trim() || null,
      property_id: (tenant as any).propertyId?.trim() || null,
      property_name: (tenant as any).propertyName?.trim() || null,
    };

    console.log('📋 [SYNC-FIX] Insert data prepared:', insertData);

    const { data, error } = await this.supabase
      .from('tenants')
      .insert(insertData)
      .select('*')
      .single();

    if (error || !data) {
      console.error('❌ Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error?.message || 'Unknown error'}`);
    }

    console.log('✅ [SYNC-FIX] Created tenant:', data);

    // Handle unit assignment if provided
    const unitNumber = (tenant as any).unit;
    const propertyId = (tenant as any).propertyId;
    
    if (unitNumber && unitNumber.trim() !== '' && propertyId) {
      console.log('🏠 [SYNC-FIX] Creating unit assignment for new tenant');
      await this.createTenantUnitAssignment(data.id, unitNumber, propertyId);
    }

    return this.formatTenantResponse(data, unitNumber || '');
  }

  async updateTenant(id: string, updates: Partial<Tenant & { propertyId?: string }>): Promise<Tenant> {
    console.log('🔄 [SYNC-FIX] Updating tenant in Supabase:', id);
    console.log('📥 [SYNC-FIX] Raw updates received:', updates);

    const user = await this.ensureAuthenticated();

    // Prepare update data with proper validation
    const updateData: any = {};

    // Basic fields with null safety
    if (updates.name !== undefined) updateData.name = updates.name?.trim() || 'Sin nombre';
    if (updates.email !== undefined) updateData.email = updates.email?.trim() || null;
    if (updates.phone !== undefined) updateData.phone = updates.phone?.trim() || null;
    if (updates.status !== undefined) updateData.status = updates.status;
    
    // Date fields with proper validation
    if (updates.moveInDate !== undefined) {
      updateData.lease_start_date = updates.moveInDate || null;
    }
    if (updates.leaseEndDate !== undefined) {
      updateData.lease_end_date = updates.leaseEndDate || null;
    }
    
    // Numeric fields with validation
    if (updates.rentAmount !== undefined) {
      updateData.rent_amount = Number(updates.rentAmount || 0);
    }
    if (updates.depositAmount !== undefined) {
      updateData.deposit_amount = Number(updates.depositAmount || 0);
    }
    
    // Property assignment with validation
    if (updates.propertyId !== undefined) {
      const propertyId = updates.propertyId?.trim() || null;
      updateData.property_id = propertyId;
      
      // Get property name if propertyId is provided
      if (propertyId) {
        try {
          const { data: propertyData } = await this.supabase
            .from('properties')
            .select('name')
            .eq('id', propertyId)
            .single();
          
          if (propertyData?.name) {
            updateData.property_name = propertyData.name;
            console.log('🏠 [SYNC-FIX] Got property name:', propertyData.name);
          }
        } catch (error) {
          console.error('❌ Error getting property name:', error);
        }
      } else {
        updateData.property_name = null;
      }
    }
    
    // Notes with validation
    if (updates.notes !== undefined) updateData.notes = updates.notes?.trim() || null;

    console.log('📤 [SYNC-FIX] Mapped update data for database:', updateData);

    // Update tenant record with conflict handling
    let { data, error } = await this.supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .eq('landlord_id', user.id)
      .select('*')
      .single();

    // Handle email conflicts gracefully
    if (error && error.message.includes('tenants_email_key')) {
      console.log('⚠️ [SYNC-FIX] Email conflict detected, updating without email...');
      const updateDataWithoutEmail = { ...updateData };
      delete updateDataWithoutEmail.email;

      const result = await this.supabase
        .from('tenants')
        .update(updateDataWithoutEmail)
        .eq('id', id)
        .eq('landlord_id', user.id)
        .select('*')
        .single();

      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      console.error('❌ Error updating tenant:', error);
      throw new Error(`Failed to update tenant: ${error?.message || 'Unknown error'}`);
    }

    console.log('✅ [SYNC-FIX] Updated tenant in database:', data);

    // Handle unit assignment changes
    const unitNumber = updates.unit;
    const propertyId = updates.propertyId;
    
    if (unitNumber !== undefined || propertyId !== undefined) {
      console.log('🔄 [SYNC-FIX] Syncing tenant-unit assignment:', {
        tenantId: id,
        unit: unitNumber,
        propertyId: propertyId
      });
      await this.syncTenantUnitAssignment(id, unitNumber, propertyId);
    }

    return this.formatTenantResponse(data, unitNumber || '');
  }

  // Helper method to format tenant response consistently
  private formatTenantResponse(data: any, unitNumber: string = ''): Tenant {
    return {
      id: data.id,
      user_id: data.landlord_id || '',
      landlord_id: data.landlord_id,
      name: data.name || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || '',
      lease_start_date: data.lease_start_date || '',
      lease_end_date: data.lease_end_date || '',
      rent_amount: Number(data.rent_amount || 0),
      status: data.status || 'active',
      unit_number: unitNumber,
      property_id: data.property_id,
      property_name: data.property_name || 'Sin propiedad',
      created_at: data.created_at,
      updated_at: data.updated_at,

      // Legacy aliases for forms
      unit: unitNumber || '',
      moveInDate: data.lease_start_date || '',
      leaseEndDate: data.lease_end_date || '',
      rentAmount: Number(data.rent_amount || 0),
      depositAmount: Number(data.deposit_amount || 0),
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: data.property_name || 'Sin propiedad',
      propertyAddress: '',
      notes: data.notes || '',
    };
  }

  // Method to create tenant-unit assignment
  private async createTenantUnitAssignment(tenantId: string, unitNumber: string, propertyId: string): Promise<void> {
    try {
      console.log('🏠 [SYNC-FIX] Creating tenant-unit assignment:', { tenantId, unitNumber, propertyId });

      // Check if assignment table exists, if not, skip this step
      const { data: assignmentData, error: assignmentError } = await this.supabase
        .from('tenant_unit_assignments')
        .upsert({
          tenant_id: tenantId,
          unit_number: unitNumber,
          property_id: propertyId,
          assigned_at: new Date().toISOString()
        }, {
          onConflict: 'tenant_id'
        });

      if (assignmentError) {
        console.log('⚠️ [SYNC-FIX] Assignment table not available, skipping assignment tracking');
      } else {
        console.log('✅ [SYNC-FIX] Tenant-unit assignment created');
      }

    } catch (error) {
      console.log('⚠️ [SYNC-FIX] Assignment tracking not available:', error);
      // Don't throw error - this is optional functionality
    }
  }

  // Method to sync tenant-unit assignment
  private async syncTenantUnitAssignment(tenantId: string, unitNumber?: string, propertyId?: string): Promise<void> {
    try {
      console.log('🔄 [SYNC-FIX] Syncing tenant-unit assignment:', { tenantId, unitNumber, propertyId });

      // Remove existing assignments for this tenant
      const { error: removeError } = await this.supabase
        .from('tenant_unit_assignments')
        .delete()
        .eq('tenant_id', tenantId);

      if (removeError) {
        console.log('⚠️ [SYNC-FIX] Could not remove existing assignments (table may not exist)');
      }

      // Create new assignment if unit and property are provided
      if (unitNumber && unitNumber.trim() !== '' && unitNumber !== 'Sin unidad' && propertyId) {
        await this.createTenantUnitAssignment(tenantId, unitNumber, propertyId);
      } else {
        console.log('📝 [SYNC-FIX] No valid unit assignment provided');
      }

    } catch (error) {
      console.log('⚠️ [SYNC-FIX] Assignment sync not available:', error);
      // Don't throw error - this is optional functionality
    }
  }

  async deleteTenant(id: string): Promise<boolean> {
    console.log('🗑️ Deleting tenant from Supabase:', id);

    const user = await this.ensureAuthenticated();

    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', id)
      .eq('landlord_id', user.id);

    if (error) {
      console.error('❌ Error deleting tenant:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }

    console.log('✅ Tenant deleted successfully');
    return true;
  }
}