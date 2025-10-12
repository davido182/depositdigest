import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  async getTenants(): Promise<Tenant[]> {
    console.log('🔍 Fetching tenants from Supabase...');

    const user = await this.ensureAuthenticated();

    console.log('👤 Fetching tenants for landlord:', user.id);
    const { data, error } = await this.supabase
      .from('tenants')
      .select(`
        *,
        properties(name, address)
      `)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    console.log('✅ Fetched tenants:', data?.length || 0);

    // Transform database format to app format using REAL fields from Supabase types
    return (data || []).map(tenant => {
      console.log(`📋 Processing tenant ${tenant.name}: rent=${tenant.rent_amount}`);

      return {
        id: tenant.id,
        user_id: tenant.user_id,
        landlord_id: tenant.landlord_id,
        name: tenant.name || 'Sin nombre',
        email: tenant.email || '',
        phone: tenant.phone || '',
        lease_start_date: tenant.lease_start_date,
        lease_end_date: tenant.lease_end_date,
        rent_amount: Number(tenant.rent_amount || 0),
        status: tenant.status,
        unit_number: tenant.unit_number,
        property_id: tenant.property_id,
        property_name: tenant.property_name,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,
        
        // Legacy aliases for forms
        unit: tenant.unit_number || 'Sin unidad',
        moveInDate: tenant.lease_start_date || '',
        leaseEndDate: tenant.lease_end_date || '',
        rentAmount: Number(tenant.rent_amount || 0),
        depositAmount: 0, // Not in database
        paymentHistory: [],
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
        propertyName: tenant.property_name || 'Sin propiedad',
        propertyAddress: '', // Not available in this query
        notes: '', // Not in database
      };
    });
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('📝 Creating tenant in Supabase:', tenant);

    const user = await this.ensureAuthenticated();

    // Prepare the insert data with REAL database fields from Supabase types
    const insertData = {
      user_id: user.id, // Required field
      landlord_id: user.id,
      name: tenant.name || 'Sin nombre',
      email: tenant.email || '',
      phone: tenant.phone || null,
      lease_start_date: tenant.moveInDate || tenant.lease_start_date || new Date().toISOString().split('T')[0],
      lease_end_date: tenant.leaseEndDate || tenant.lease_end_date || null,
      rent_amount: Number(tenant.rentAmount || tenant.rent_amount || 0),
      status: tenant.status || 'active',
      unit_number: tenant.unit || tenant.unit_number || 'Sin unidad',
      property_id: (tenant as any).propertyId || tenant.property_id || null,
      property_name: (tenant as any).propertyName || tenant.property_name || null
    };

    console.log('📤 Insert data:', insertData);

    const { data, error } = await this.supabase
      .from('tenants')
      .insert(insertData)
      .select(`
        *,
        properties(name, address)
      `)
      .single();

    if (error) {
      console.error('❌ Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    console.log('✅ Created tenant:', data);

    // Update unit if assigned
    if (tenant.unit && tenant.unit !== 'Sin unidad' && (tenant as any).propertyId) {
      await this.assignTenantToUnit(data.id, tenant.unit, (tenant as any).propertyId);
    }

    return {
      id: data.id,
      name: data.name || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || '',
      unit: 'Sin unidad', // Units are separate now
      moveInDate: data.moveInDate || '',
      leaseEndDate: data.leaseEndDate || '',
      rentAmount: Number(data.rent_amount || 0),
      depositAmount: Number(data.depositAmount || 0),
      status: data.status as any,
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: (data.properties?.name) || 'Sin propiedad',
      propertyAddress: (data.properties?.address) || '',
      property_id: data.property_id,
      landlord_id: data.landlord_id,
      notes: data.notes,
    };
  }

  async updateTenant(id: string, updates: Partial<Tenant & { propertyId?: string }>): Promise<Tenant> {
    console.log('🔄 Updating tenant in Supabase:', id, updates);

    const user = await this.ensureAuthenticated();

    // Prepare update data with REAL database fields from migration
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.moveInDate !== undefined) updateData.moveInDate = updates.moveInDate;
    if (updates.leaseEndDate !== undefined) updateData.leaseEndDate = updates.leaseEndDate;
    if (updates.rentAmount !== undefined) updateData.rent_amount = Number(updates.rentAmount);
    if (updates.depositAmount !== undefined) updateData.deposit_amount = Number(updates.depositAmount);
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.propertyId !== undefined) updateData.property_id = updates.propertyId;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    console.log('📤 Update data:', updateData);

    const { data, error } = await this.supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .eq('landlord_id', user.id) // Security check
      .select(`
        *,
        properties(name, address)
      `)
      .single();

    if (error) {
      console.error('❌ Error updating tenant:', error);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    console.log('✅ Updated tenant:', data);

    // Update unit assignment if changed
    if (updates.unit !== undefined && updates.propertyId) {
      await this.assignTenantToUnit(id, updates.unit, updates.propertyId);
    }

    return {
      id: data.id,
      name: data.name || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || '',
      unit: 'Sin unidad', // Units are separate now
      moveInDate: data.moveInDate || '',
      leaseEndDate: data.leaseEndDate || '',
      rentAmount: Number(data.rent_amount || 0),
      depositAmount: Number(data.depositAmount || 0),
      status: data.status as any,
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: (data.properties?.name) || 'Sin propiedad',
      propertyAddress: (data.properties?.address) || '',
      property_id: data.property_id,
      landlord_id: data.landlord_id,
      notes: data.notes,
    };
  }

  async deleteTenant(id: string): Promise<boolean> {
    console.log('🗑️ Deleting tenant from Supabase:', id);

    const user = await this.ensureAuthenticated();

    // First, free up any assigned unit
    await this.unassignTenantFromUnit(id);

    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', id)
      .eq('landlord_id', user.id); // Security check

    if (error) {
      console.error('❌ Error deleting tenant:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }

    console.log('✅ Tenant deleted successfully');
    return true;
  }

  // Helper method to assign tenant to unit
  private async assignTenantToUnit(tenantId: string, unitNumber: string, propertyId: string): Promise<void> {
    if (!unitNumber || unitNumber === 'Sin unidad') return;

    try {
      console.log('🏠 Assigning tenant to unit:', { tenantId, unitNumber, propertyId });

      const { error } = await this.supabase
        .from('units')
        .update({
          tenant_id: tenantId,
          is_available: false
        })
        .eq('unit_number', unitNumber)
        .eq('property_id', propertyId);

      if (error) {
        console.error('❌ Error assigning tenant to unit:', error);
        // Don't throw error here, just log it
      } else {
        console.log('✅ Tenant assigned to unit successfully');
      }
    } catch (error) {
      console.error('❌ Error in assignTenantToUnit:', error);
    }
  }

  // Helper method to unassign tenant from unit
  private async unassignTenantFromUnit(tenantId: string): Promise<void> {
    try {
      console.log('🏠 Unassigning tenant from unit:', tenantId);

      const { error } = await this.supabase
        .from('units')
        .update({
          tenant_id: null,
          is_available: true
        })
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('❌ Error unassigning tenant from unit:', error);
      } else {
        console.log('✅ Tenant unassigned from unit successfully');
      }
    } catch (error) {
      console.error('❌ Error in unassignTenantFromUnit:', error);
    }
  }
}