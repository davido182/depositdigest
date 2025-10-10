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

    // Transform database format to app format using REAL fields from migration
    return (data || []).map(tenant => {
      console.log(`📋 Processing tenant ${tenant.name}: rent=${tenant.rent_amount}`);

      return {
        id: tenant.id,
        name: tenant.name || 'Sin nombre',
        email: tenant.email || '',
        phone: tenant.phone || '',
        unit: 'Sin unidad', // Units are separate table now
        moveInDate: tenant.moveInDate || '',
        leaseEndDate: tenant.leaseEndDate || '',
        rentAmount: Number(tenant.rent_amount || 0),
        depositAmount: Number(tenant.depositAmount || 0),
        status: tenant.status as any,
        paymentHistory: [],
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
        propertyName: (tenant.properties?.name) || 'Sin propiedad',
        propertyAddress: (tenant.properties?.address) || '',
        property_id: tenant.property_id,
        landlord_id: tenant.landlord_id,
        notes: tenant.notes,
      };
    });
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('📝 Creating tenant in Supabase:', tenant);

    const user = await this.ensureAuthenticated();

    // Prepare the insert data with REAL database fields from migration
    const insertData = {
      landlord_id: user.id,
      name: tenant.name || 'Sin nombre',
      email: tenant.email || '',
      phone: tenant.phone || null,
      moveInDate: tenant.moveInDate || new Date().toISOString().split('T')[0],
      leaseEndDate: tenant.leaseEndDate || null,
      rent_amount: Number(tenant.rentAmount || 0),
      depositAmount: Number(tenant.depositAmount || 0),
      status: tenant.status || 'active',
      property_id: (tenant as any).propertyId || null,
      notes: tenant.notes || null
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
    if (updates.depositAmount !== undefined) updateData.depositAmount = Number(updates.depositAmount);
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