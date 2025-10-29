import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  async getTenants(): Promise<Tenant[]> {
    console.log('🔍 [SIMPLE] Fetching tenants from Supabase...');

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

    // Transform tenant data using ONLY what's in the tenant record
    return tenantsData
      .filter(tenant => tenant?.name && tenant.name.trim() !== '')
      .map(tenant => {
        const fullName = tenant.name || 'Sin nombre';
        
        // Use data directly from tenant record
        const unitNumber = tenant.unit_number || '';
        const propertyId = tenant.property_id || '';
        const propertyName = tenant.property_name || '';

        console.log(`📋 [SIMPLE] Mapping tenant ${fullName}:`, {
          tenantId: tenant.id,
          unit_number: tenant.unit_number,
          property_id: tenant.property_id,
          property_name: tenant.property_name,
          finalUnit: unitNumber,
          finalProperty: propertyName,
          rawUnitType: typeof tenant.unit_number,
          rawPropertyType: typeof tenant.property_name
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

          // Legacy aliases for forms - USING DIRECT DATA
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

    const user = await this.ensureAuthenticated();

    // Prepare insert data with proper validation including unit assignment
    const unitNumber = (tenant as any).unit?.trim() || null;
    const propertyId = (tenant as any).propertyId?.trim() || null;
    const propertyName = (tenant as any).propertyName?.trim() || null;

    const insertData = {
      landlord_id: user.id,
      name: tenant.name?.trim() || 'Sin nombre',
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

    console.log('✅ [SYNC-FIX] Created tenant:', data);

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
    if (updates.notes !== undefined) updateData.notes = updates.notes?.trim() || null;

    // Unit assignment (moved here to be included in main update)
    if (updates.unit !== undefined) {
      updateData.unit_number = updates.unit?.trim() || null;
      console.log('🏠 [SIMPLE] Including unit_number in main update:', updateData.unit_number);
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

    console.log('✅ [SIMPLE] Updated tenant in database:', data);

    return this.formatTenantResponse(data, updates.unit || data.unit_number || '');
  }

  // Helper method to format tenant response consistently
  private formatTenantResponse(data: any, unitNumber: string = ''): Tenant {
    const finalUnitNumber = unitNumber || data.unit_number || '';
    const finalPropertyName = data.property_name || '';
    
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