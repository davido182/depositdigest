import { BaseService } from './BaseService';
import { Tenant } from '@/types';
import { normalizeTenant, normalizeArray } from '@/types/database';

// Helper to cast DB tenant (name nullable) to app Tenant (name required)
function toAppTenant(t: any): Tenant {
  return normalizeTenant(t) as unknown as Tenant;
}

export class SupabaseTenantService extends BaseService {
  async getTenants(): Promise<Tenant[]> {
    // Fetching tenants from Supabase

    const user = await this.ensureAuthenticated();
    // User authenticated successfully

    // Get tenants with proper error handling
    const { data: tenantsData, error: tenantsError } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('landlord_id', user.id);

    if (tenantsError) {
      // Removed console for security
      throw new Error(`Failed to fetch tenants: ${tenantsError.message}`);
    }

    // Tenant data loaded successfully

    if (!tenantsData || tenantsData.length === 0) {
      // No tenants found
      return [];
    }

    // Get property names for tenants that have property_id
    const propertyIds = tenantsData
      .filter(tenant => tenant.property_id)
      .map(tenant => tenant.property_id)
      .filter((id): id is string => id !== null);

    let propertiesData: any[] = [];
    if (propertyIds.length > 0) {
      const { data: properties, error: propertiesError } = await this.supabase
        .from('properties')
        .select('id, name')
        .in('id', propertyIds);

      if (!propertiesError && properties) {
        propertiesData = properties;
        // Removed console.log for security
      }
    }

    // Transform tenant data using normalization helper
    return normalizeArray(
      tenantsData.filter((tenant: any) => {
        const hasName = (tenant?.name && tenant.name.trim() !== '') || 
                       (tenant?.first_name && tenant.first_name.trim() !== '');
        return hasName;
      }).map((tenant: any) => {
        const property = propertiesData.find(p => p.id === tenant.property_id);
        return {
          ...tenant,
          property_name: property?.name || tenant.property_name || '',
        };
      }),
      toAppTenant
    ) as Tenant[];
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    // Removed console.log for security
    // Removed console.log for security

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

    const insertData: any = {
      user_id: user.id,
      landlord_id: user.id,
      name: tenantName,
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

    // Removed console.log for security

    const { data, error } = await this.supabase
      .from('tenants')
      .insert(insertData)
      .select('*')
      .single();

    if (error || !data) {
      // Removed console for security
      throw new Error(`Failed to create tenant: ${error?.message || 'Unknown error'}`);
    }

    // Tenant created successfully

    // SINCRONIZACIÓN BIDIRECCIONAL: Actualizar tabla units también
    if (unitNumber && unitNumber.trim() !== '' && propertyId && propertyId.trim() !== '') {
      await this.syncUnitsTableFromTenant(data.id, unitNumber, propertyId);
    }

    return this.formatTenantResponse(data, unitNumber || '');
  }

  async updateTenant(id: string, updates: Partial<Tenant & { propertyId?: string }>): Promise<Tenant> {
    // Removed console.log for security
    // Removed console.log for security

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
            // Removed console.log for security
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
      // Removed console.log for security
    }

    // Removed console.log for security

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
      // Removed console.log for security
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
      // Removed console for security
      throw new Error(`Failed to update tenant: ${error?.message || 'Unknown error'}`);
    }

    // Tenant updated successfully

    // SINCRONIZACIÓN BIDIRECCIONAL: Actualizar tabla units también
    if (updates.unit !== undefined || updates.propertyId !== undefined) {
      await this.syncUnitsTableFromTenant(id, updates.unit, updates.propertyId);
    }

    return this.formatTenantResponse(data, updates.unit || data.unit_number || '');
  }

  // Helper method to format tenant response consistently
  private formatTenantResponse(data: any, unitNumber: string = ''): Tenant {
    return toAppTenant({
      ...data,
      unit_number: unitNumber || data.unit_number || '',
    });
  }



  // Método para sincronizar tabla units cuando se edita un inquilino
  private async syncUnitsTableFromTenant(tenantId: string, unitNumber?: string, propertyId?: string): Promise<void> {
    try {
      // Removed console.log for security

      // Paso 1: Desasignar inquilino de cualquier unidad actual
      const { error: unassignError } = await this.supabase
        .from('units')
        .update({
          tenant_id: null,
          is_available: true
        })
        .eq('tenant_id', tenantId);

      if (unassignError) {
        // Removed console for security
      } else {
        // Removed console.log for security
      }

      // Paso 2: Si hay nueva unidad y propiedad, asignar
      if (unitNumber && unitNumber.trim() !== '' && propertyId && propertyId.trim() !== '') {
        // Removed console.log for security

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
            monthly_rent: tenantData?.rent_amount || null // sync rent to units
          })
          .eq('unit_number', unitNumber)
          .eq('property_id', propertyId);

        if (assignError) {
          // Removed console for security
        } else {
          // Removed console.log for security
        }
      }

      // Removed console.log for security

    } catch (error) {
      console.error('❌ Error syncing units table:', error);
      // No lanzar error - la actualización del inquilino ya fue exitosa
    }
  }

  async deleteTenant(id: string): Promise<boolean> {
    // Removed console.log for security

    const user = await this.ensureAuthenticated();

    // Primero desasignar de units
    await this.syncUnitsTableFromTenant(id, '', '');

    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', id)
      .eq('landlord_id', user.id);

    if (error) {
      // Removed console for security
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }

    // Removed console.log for security
    return true;
  }
}

