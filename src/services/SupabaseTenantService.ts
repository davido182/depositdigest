import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  async getTenants(): Promise<Tenant[]> {
    console.log('🔍 [DEFINITIVE] Fetching tenants from Supabase...');

    const user = await this.ensureAuthenticated();
    console.log('👤 User authenticated:', user.id);

    // Auto-cleanup corrupted data for current user
    await this.autoCleanupCorruptedData(user.id);

    // Simple query first - just get all data
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('landlord_id', user.id);

    if (error) {
      console.error('❌ Error fetching tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    console.log('✅ Raw tenant data:', data);
    console.log('📊 Found tenants:', data?.length || 0);

    if (!data || data.length === 0) {
      console.log('📭 No tenants found');
      return [];
    }

    // Fetch ALL units with property information for the current user
    const { data: unitsData, error: unitsError } = await this.supabase
      .from('units')
      .select(`
        id, 
        unit_number, 
        tenant_id, 
        property_id, 
        monthly_rent,
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
      console.log('❌ Units error details:', unitsError);
    }

    console.log('✅ [DEFINITIVE] Fetched units with tenants:', unitsData?.length || 0);
    if (unitsData && unitsData.length > 0) {
      console.log('📋 [DEFINITIVE] Sample unit data:', unitsData[0]);
    }

    // Show structure of first tenant
    if (data && data.length > 0 && data[0]) {
      console.log('🔍 First tenant structure:', Object.keys(data[0]));
      console.log('🔍 First tenant data:', data[0]);
    }

    // Transform with unit and property information
    return data
      .filter(tenant => tenant.name && tenant.name.trim() !== '') // Filter out tenants with null/empty names
      .map(tenant => {
        const fullName = tenant.name || 'Sin nombre';

        // Find the unit assigned to this tenant
        const assignedUnit = unitsData?.find(unit => unit.tenant_id === tenant.id);
        const unitNumber = assignedUnit?.unit_number || null;
        const propertyFromUnit = assignedUnit?.properties;

        // Use property info from unit if available, otherwise from tenant record
        // NEVER use hardcoded default values - only real data or null
        const propertyName = assignedUnit?.properties?.name || 
                            (tenant.property_name && 
                             tenant.property_name !== 'Sin propiedad' && 
                             tenant.property_name !== 'Edificio Principal' &&
                             tenant.property_name !== 'Sin asignar' &&
                             tenant.property_name.trim() !== '' ? tenant.property_name : null);
        const propertyAddress = assignedUnit?.properties?.address || '';
        const propertyId = assignedUnit?.property_id || tenant.property_id;

        console.log(`📋 [MAPPING] Tenant ${fullName}:`, {
          unit: unitNumber,
          property: propertyName,
          propertyId: propertyId,
          hasAssignedUnit: !!assignedUnit,
          unitFromDB: assignedUnit?.unit_number,
          propertyFromUnit: assignedUnit?.properties?.name,
          propertyFromTenant: tenant.property_name
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
          rent_amount: Number(tenant.rent_amount || 0),
          status: tenant.status || 'active',
          unit_number: unitNumber || '',
          property_id: propertyId,
          property_name: propertyName || '',
          created_at: tenant.created_at,
          updated_at: tenant.updated_at,

          // Legacy aliases for forms
          unit: unitNumber || '',
          moveInDate: tenant.lease_start_date || '',
          leaseEndDate: tenant.lease_end_date || '',
          rentAmount: Number(tenant.rent_amount || 0),
          depositAmount: Number((tenant as any).deposit_amount || 0),
          paymentHistory: [],
          createdAt: tenant.created_at,
          updatedAt: tenant.updated_at,
          propertyName: propertyName || '',
          propertyAddress: propertyAddress,
          notes: (tenant as any).notes || '',
        };
      });
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('📝 Creating tenant in Supabase:', tenant);

    const user = await this.ensureAuthenticated();

    // Use correct database field names
    const insertData = {
      landlord_id: user.id,
      name: tenant.name || 'Sin nombre',
      email: tenant.email || '',
      phone: tenant.phone || null,
      lease_start_date: tenant.moveInDate || new Date().toISOString().split('T')[0],
      lease_end_date: tenant.leaseEndDate || null,
      rent_amount: Number(tenant.rentAmount || 0),
      deposit_amount: Number(tenant.depositAmount || 0),
      status: tenant.status || 'active',
      notes: tenant.notes || '',
      user_id: user.id,
      unit_number: '',
      // Validate UUIDs - only set if they're valid or null
      property_id: (tenant as any).propertyId && (tenant as any).propertyId.trim() !== '' ? (tenant as any).propertyId : null,
      property_name: (tenant as any).propertyName || null,
    };

    console.log('📋 Insert data prepared:', insertData);

    const { data, error } = await this.supabase
      .from('tenants')
      .insert(insertData)
      .select('*')
      .single();

    if (error || !data) {
      console.error('❌ Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error?.message || 'Unknown error'}`);
    }

    console.log('✅ Created tenant:', data);

    return {
      id: data.id,
      user_id: data.user_id || '',
      landlord_id: data.landlord_id || '',
      name: data.name || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || '',
      lease_start_date: data.lease_start_date || '',
      lease_end_date: data.lease_end_date || '',
      rent_amount: Number(data.rent_amount || 0),
      status: data.status || 'active',
      unit_number: '',
      property_id: data.property_id,
      property_name: data.property_name || 'Sin propiedad',
      created_at: data.created_at,
      updated_at: data.updated_at,

      // Legacy aliases
      unit: 'Sin unidad',
      moveInDate: data.lease_start_date || '',
      leaseEndDate: data.lease_end_date || '',
      rentAmount: Number(data.rent_amount || 0),
      depositAmount: Number((data as any).deposit_amount || 0),
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: data.property_name || 'Sin propiedad',
      propertyAddress: '',
      notes: (data as any).notes || '',
    };
  }

  async updateTenant(id: string, updates: Partial<Tenant & { propertyId?: string }>): Promise<Tenant> {
    console.log('🔄 [DEFINITIVE] Updating tenant in Supabase:', id);
    console.log('📥 [DEFINITIVE] Raw updates received:', updates);
    console.log('🔍 [DEFINITIVE] Unit and PropertyId check:', {
      unit: updates.unit,
      propertyId: updates.propertyId,
      unitUndefined: updates.unit === undefined,
      propertyIdUndefined: updates.propertyId === undefined
    });

    const user = await this.ensureAuthenticated();

    // Map fields to correct database column names
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.email !== undefined) {
      updateData.email = updates.email || null;
    }
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.moveInDate !== undefined) {
      updateData.lease_start_date = updates.moveInDate || null;
    }
    if (updates.leaseEndDate !== undefined) {
      updateData.lease_end_date = updates.leaseEndDate || null;
    }
    if (updates.rentAmount !== undefined) {
      updateData.rent_amount = Number(updates.rentAmount || 0);
    }
    if (updates.depositAmount !== undefined) {
      updateData.deposit_amount = Number(updates.depositAmount || 0);
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.propertyId !== undefined) {
      // Validate UUID - only set if it's a valid UUID or null
      const propertyId = updates.propertyId && updates.propertyId.trim() !== '' ? updates.propertyId : null;
      updateData.property_id = propertyId;
      
      // Get the real property name from the database if propertyId is provided
      if (propertyId) {
        try {
          const { data: propertyData } = await this.supabase
            .from('properties')
            .select('name')
            .eq('id', propertyId)
            .single();
          
          updateData.property_name = propertyData?.name || null;
          console.log('🏠 [UPDATE] Setting property_name from DB:', propertyData?.name);
        } catch (error) {
          console.error('❌ Error fetching property name:', error);
          updateData.property_name = null;
        }
      } else {
        updateData.property_name = null;
      }
    }
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    console.log('📤 Mapped update data for database:', updateData);

    // Try update, if email conflict, try without email
    let { data, error } = await this.supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .eq('landlord_id', user.id)
      .select('*')
      .single();

    // If email conflict, try again without email
    if (error && error.message.includes('tenants_email_key')) {
      console.log('⚠️ Email conflict detected, updating without email...');
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

    console.log('✅ Updated tenant in database:', data);

    // If unit assignment changed, update the units table
    if (updates.unit !== undefined || updates.propertyId !== undefined) {
      console.log('🔄 [UPDATE] Calling syncTenantUnitAssignment with:', {
        tenantId: id,
        unit: updates.unit,
        propertyId: updates.propertyId,
        unitUndefined: updates.unit === undefined,
        propertyIdUndefined: updates.propertyId === undefined,
        finalPropertyName: updateData.property_name
      });
      await this.syncTenantUnitAssignment(id, updates.unit, updates.propertyId);
    } else {
      console.log('⏭️ [UPDATE] No unit/property changes detected, skipping sync');
    }

    const result = {
      id: data.id,
      user_id: data.user_id || '',
      landlord_id: data.landlord_id || '',
      name: data.name || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || '',
      lease_start_date: data.lease_start_date || '',
      lease_end_date: data.lease_end_date || '',
      rent_amount: Number(data.rent_amount || 0),
      status: data.status || 'active',
      unit_number: '',
      property_id: data.property_id,
      property_name: data.property_name || 'Sin propiedad',
      created_at: data.created_at,
      updated_at: data.updated_at,

      // Legacy aliases
      unit: 'Sin unidad',
      moveInDate: data.lease_start_date || '',
      leaseEndDate: data.lease_end_date || '',
      rentAmount: Number(data.rent_amount || 0),
      depositAmount: Number((data as any).deposit_amount || 0),
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: data.property_name || 'Sin propiedad',
      propertyAddress: '',
      notes: (data as any).notes || '',
    };

    console.log('📋 Returning formatted tenant data:', result);
    return result;
  }

  // Auto-cleanup method for corrupted data
  private async autoCleanupCorruptedData(userId: string): Promise<void> {
    try {
      console.log('🧹 [CLEANUP] Auto-cleaning corrupted data for user:', userId);
      
      // Clean up hardcoded property names for current user only
      const { error: cleanupError } = await this.supabase
        .from('tenants')
        .update({ 
          property_name: null 
        })
        .eq('landlord_id', userId)
        .in('property_name', ['Sin propiedad', 'Edificio Principal', 'Sin asignar']);

      if (cleanupError) {
        console.error('❌ Error in auto-cleanup:', cleanupError);
      } else {
        console.log('✅ [CLEANUP] Auto-cleanup completed for user:', userId);
      }
    } catch (error) {
      console.error('❌ Exception in auto-cleanup:', error);
    }
  }

  // Method to sync tenant-unit assignment
  private async syncTenantUnitAssignment(tenantId: string, unitNumber?: string, propertyId?: string): Promise<void> {
    try {
      console.log('🔄 [SYNC] Syncing tenant-unit assignment:', { tenantId, unitNumber, propertyId });

      // First, unassign tenant from any current units
      const { error: unassignError } = await this.supabase
        .from('units')
        .update({
          tenant_id: null,
          is_available: true
        })
        .eq('tenant_id', tenantId);

      if (unassignError) {
        console.error('❌ Error unassigning tenant from units:', unassignError);
      } else {
        console.log('✅ Tenant unassigned from all units');
      }

      // If a unit is specified, assign tenant to that unit
      if (unitNumber && unitNumber !== 'Sin unidad' && unitNumber !== '' && propertyId) {
        console.log('🏠 Assigning tenant to unit:', { unitNumber, propertyId });

        const { error: assignError } = await this.supabase
          .from('units')
          .update({
            tenant_id: tenantId,
            is_available: false
          })
          .eq('unit_number', unitNumber)
          .eq('property_id', propertyId);

        if (assignError) {
          console.error('❌ Error assigning tenant to unit:', assignError);
          throw new Error(`Failed to assign tenant to unit: ${assignError.message}`);
        } else {
          console.log('✅ Tenant assigned to unit successfully');
        }
      } else {
        console.log('📝 No unit assignment needed (unit is empty or invalid)');
      }

      // Verify the assignment
      const { data: verifyData, error: verifyError } = await this.supabase
        .from('units')
        .select('unit_number, tenant_id, is_available')
        .eq('tenant_id', tenantId);

      if (!verifyError && verifyData) {
        console.log('🔍 Verification - Units assigned to tenant:', verifyData);
      }

    } catch (error) {
      console.error('❌ Error in syncTenantUnitAssignment:', error);
      throw error;
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