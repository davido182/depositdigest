import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  async getTenants(): Promise<Tenant[]> {
    console.log('🔍 [SIMPLE] Fetching tenants from Supabase...');

    const user = await this.ensureAuthenticated();
    // User authenticated successfully

    // Get tenants with proper error handling
    const { data: tenantsData, error: tenantsError } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('landlord_id', user.id);

    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError);
      throw new Error(`Failed to fetch tenants: ${tenantsError.message}`);
    }

    console.log('✅ [SIMPLE] Raw tenant data:', tenantsData?.length || 0, 'tenants');
    
    // Log first tenant to see what fields we actually have
    if (tenantsData && tenantsData.length > 0) {
      console.log('🔍 [SIMPLE] First tenant raw data:', tenantsData[0]);
      console.log('🔍 [SIMPLE] First tenant unit_number:', tenantsData[0].unit_number);
      console.log('🔍 [SIMPLE] First tenant property_name:', tenantsData[0].property_name);
      console.log('🔍 [SIMPLE] First tenant property_id:', tenantsData[0].property_id);
    }

    if (!tenantsData || tenantsData.length === 0) {
      console.log('📭 No tenants found');
      return [];
    }

    // Get property names for tenants that have property_id
    const propertyIds = tenantsData
      .filter(tenant => tenant.property_id)
      .map(tenant => tenant.property_id);

    let propertiesData: any[] = [];
    if (propertyIds.length > 0) {
      const { data: properties, error: propertiesError } = await this.supabase
        .from('properties')
        .select('id, name')
        .in('id', propertyIds);

      if (!propertiesError && properties) {
        propertiesData = properties;
        console.log('✅ [SIMPLE] Loaded property names:', propertiesData.length);
      }
    }

    // Transform tenant data using available fields
    return tenantsData
      .filter(tenant => {
        // Check both name and first_name fields
        const hasName = (tenant?.name && tenant.name.trim() !== '') || 
                       (tenant?.first_name && tenant.first_name.trim() !== '');
        console.log(`🔍 [FILTER] Tenant ${tenant?.id}: name="${tenant?.name}", first_name="${tenant?.first_name}", hasName=${hasName}`);
        return hasName;
      })
      .map(tenant => {
        // Use first_name as primary, fallback to name
        const fullName = tenant.first_name || tenant.name || 'Sin nombre';
        console.log(`📝 [MAPPING] Tenant ${tenant.id}: Using name="${fullName}" (from first_name="${tenant.first_name}", name="${tenant.name}")`);
        
        // Get property name from properties data
        const property = propertiesData.find(p => p.id === tenant.property_id);
        const propertyName = property?.name || tenant.property_name || '';
        const propertyId = tenant.property_id || '';
        
        // Use unit_number from DB (will work after SQL execution)
        const unitNumber = tenant.unit_number || '';

        console.log(`📋 [DEFINITIVE] Mapping tenant ${fullName}:`, {
          tenantId: tenant.id,
          property_id: tenant.property_id,
          unit_number: tenant.unit_number,
          propertyFromDB: property?.name,
          finalProperty: propertyName,
          finalUnit: unitNumber,
          hasPropertyId: !!tenant.property_id,
          hasUnitNumber: !!tenant.unit_number
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
          unit_number: unitNumber,
          property_id: propertyId,
          property_name: propertyName,
          created_at: tenant.created_at,
          updated_at: tenant.updated_at,

          // Legacy aliases for forms
          unit: unitNumber,
          moveInDate: tenant.lease_start_date || '',
          leaseEndDate: tenant.lease_end_date || '',
          rentAmount: Number(tenant.rent_amount || 0),
          depositAmount: 0,
          paymentHistory: [],
          createdAt: tenant.created_at,
          updatedAt: tenant.updated_at,
          propertyName: propertyName,
          propertyAddress: '',
          notes: (tenant as any).notes || '',
        };
      });
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('📝 [SYNC-FIX] Creating tenant in Supabase:', tenant);
    console.log('📝 [DEBUG] Tenant name field:', {
      name: tenant.name,
      nameType: typeof tenant.name,
      nameLength: tenant.name?.length,
      nameTrimmed: tenant.name?.trim(),
      nameTrimmedLength: tenant.name?.trim()?.length
    });

    const user = await this.ensureAuthenticated();

    // Prepare insert data with proper validation including unit assignment
    const unitNumber = (tenant as any).unit?.trim() || null;
    const propertyId = (tenant as any).propertyId?.trim() || null;
    const propertyName = (tenant as any).propertyName?.trim() || null;

    // Validar que el nombre no esté vacío
    const tenantName = tenant.name?.trim();
    if (!tenantName || tenantName === '') {
      throw new Error('El nombre del inquilino es requerido');
    }

    const insertData = {
      landlord_id: user.id,
      first_name: tenantName, // BD usa first_name, no name
      last_name: '', // Campo requerido, usar string vacío por defecto
      name: tenantName, // Mantener ambos por compatibilidad
      email: tenant.email?.trim() || '',
      phone: tenant.phone?.trim() || null,
      lease_start_date: tenant.moveInDate || new Date().toISOString().split('T')[0],
      lease_end_date: tenant.leaseEndDate || null,
      rent_amount: Number(tenant.rentAmount || 0),
      status: tenant.status || 'active',
      property_id: propertyId,
      property_name: propertyName,
      unit_number: unitNumber,
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

    console.log('✅ [DEFINITIVE] Created tenant:', data);

    // SINCRONIZACIÓN BIDIRECCIONAL: Actualizar tabla units también
    if (unitNumber && unitNumber.trim() !== '' && propertyId && propertyId.trim() !== '') {
      await this.syncUnitsTableFromTenant(data.id, unitNumber, propertyId, user.id);
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
    if (updates.name !== undefined) {
      const updatedName = updates.name?.trim() || 'Sin nombre';
      updateData.name = updatedName;
      updateData.first_name = updatedName; // Sincronizar ambos campos
    }
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
    // Note: deposit_amount column doesn't exist in database, skipping
    
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
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes?.trim() || null;
    }

    // Unit assignment - Now works with unit_number column
    if (updates.unit !== undefined) {
      updateData.unit_number = updates.unit?.trim() || null;
      console.log('🏠 [DEFINITIVE] Including unit_number in update:', updateData.unit_number);
    }

    console.log('📤 [SIMPLE] Mapped update data for database:', updateData);

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

    console.log('✅ [DEFINITIVE] Updated tenant in database:', data);

    // SINCRONIZACIÓN BIDIRECCIONAL: Actualizar tabla units también
    if (updates.unit !== undefined || updates.propertyId !== undefined) {
      await this.syncUnitsTableFromTenant(id, updates.unit, updates.propertyId, user.id);
    }

    return this.formatTenantResponse(data, updates.unit || data.unit_number || '');
  }

  // Helper method to format tenant response consistently
  private formatTenantResponse(data: any, unitNumber: string = ''): Tenant {
    const finalUnitNumber = unitNumber || data.unit_number || '';
    const finalPropertyName = data.property_name || '';
    
    // Use first_name as primary, fallback to name
    const fullName = data.first_name || data.name || 'Sin nombre';
    console.log(`📝 [FORMAT] Formatting tenant response: first_name="${data.first_name}", name="${data.name}", final="${fullName}"`);
    
    return {
      id: data.id,
      user_id: data.landlord_id || '',
      landlord_id: data.landlord_id,
      name: fullName,
      email: data.email || '',
      phone: data.phone || '',
      lease_start_date: data.lease_start_date || '',
      lease_end_date: data.lease_end_date || '',
      rent_amount: Number(data.rent_amount || 0),
      status: data.status || 'active',
      unit_number: finalUnitNumber,
      property_id: data.property_id,
      property_name: finalPropertyName,
      created_at: data.created_at,
      updated_at: data.updated_at,

      // Legacy aliases for forms - CRITICAL for form display
      unit: finalUnitNumber,
      moveInDate: data.lease_start_date || '',
      leaseEndDate: data.lease_end_date || '',
      rentAmount: Number(data.rent_amount || 0),
      depositAmount: 0, // Column doesn't exist in database
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: finalPropertyName,
      propertyAddress: '',
      notes: data.notes || '',
    };
  }



  // Método para sincronizar tabla units cuando se edita un inquilino
  private async syncUnitsTableFromTenant(tenantId: string, unitNumber?: string, propertyId?: string, userId?: string): Promise<void> {
    try {
      console.log('🔄 [BIDIRECTIONAL] Syncing units table from tenant update:', {
        tenantId,
        unitNumber,
        propertyId
      });

      // Paso 1: Desasignar inquilino de cualquier unidad actual
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
        console.log('✅ [BIDIRECTIONAL] Tenant unassigned from all units');
      }

      // Paso 2: Si hay nueva unidad y propiedad, asignar
      if (unitNumber && unitNumber.trim() !== '' && propertyId && propertyId.trim() !== '') {
        console.log('🏠 [BIDIRECTIONAL] Assigning tenant to new unit:', { unitNumber, propertyId });

        // También obtener la renta del inquilino para sincronizar
        const { data: tenantData } = await this.supabase
          .from('tenants')
          .select('rent_amount')
          .eq('id', tenantId)
          .single();

        const { error: assignError } = await this.supabase
          .from('units')
          .update({
            tenant_id: tenantId,
            is_available: false,
            rent_amount: tenantData?.rent_amount || null // Sincronizar renta
          })
          .eq('unit_number', unitNumber)
          .eq('property_id', propertyId);

        if (assignError) {
          console.error('❌ Error assigning tenant to unit:', assignError);
        } else {
          console.log('✅ [BIDIRECTIONAL] Tenant assigned to unit successfully');
        }
      }

      console.log('✅ [BIDIRECTIONAL] Units table sync completed');

    } catch (error) {
      console.error('❌ Error syncing units table:', error);
      // No lanzar error - la actualización del inquilino ya fue exitosa
    }
  }

  async deleteTenant(id: string): Promise<boolean> {
    console.log('🗑️ Deleting tenant from Supabase:', id);

    const user = await this.ensureAuthenticated();

    // Primero desasignar de units
    await this.syncUnitsTableFromTenant(id, '', '', user.id);

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