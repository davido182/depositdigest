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
        properties:property_id(name, address)
      `)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    console.log('✅ Fetched tenants:', data?.length || 0);

    // Also fetch units to get tenant assignments
    const { data: unitsData, error: unitsError } = await this.supabase
      .from('units')
      .select('id, unit_number, tenant_id, property_id')
      .not('tenant_id', 'is', null);

    if (unitsError) {
      console.error('❌ Error fetching units:', unitsError);
    }

    console.log('✅ Fetched units with tenants:', unitsData?.length || 0);

    // Transform database format to app format using EXACT database fields
    return (data || []).map(tenant => {
      console.log(`📋 Processing tenant ${tenant.name || tenant.first_name}: rent=${tenant.rent_amount || tenant.monthly_rent}`);

      // Get property info from the join
      const propertyInfo = tenant.properties;
      const propertyName = propertyInfo?.name || tenant.property_name || 'Sin propiedad';
      const propertyAddress = propertyInfo?.address || '';

      // Find the unit assigned to this tenant
      const assignedUnit = unitsData?.find(unit => unit.tenant_id === tenant.id);
      const unitNumber = assignedUnit?.unit_number || 'Sin unidad';

      // Combine first_name and last_name for display name
      const fullName = tenant.name || `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Sin nombre';

      return {
        id: tenant.id,
        user_id: tenant.user_id || tenant.landlord_id,
        landlord_id: tenant.landlord_id,
        name: fullName,
        email: tenant.email || '',
        phone: tenant.phone || '',
        lease_start_date: tenant.moveindate || tenant.move_in_date || '',
        lease_end_date: tenant.leaseenddate || tenant.move_out_date || '',
        rent_amount: Number(tenant.rent_amount || tenant.monthly_rent || 0),
        status: tenant.status || (tenant.is_active ? 'active' : 'inactive'),
        unit_number: unitNumber,
        property_id: tenant.property_id,
        property_name: propertyName,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,

        // Legacy aliases for forms
        unit: unitNumber,
        moveInDate: tenant.moveindate || tenant.move_in_date || '',
        leaseEndDate: tenant.leaseenddate || tenant.move_out_date || '',
        rentAmount: Number(tenant.rent_amount || tenant.monthly_rent || 0),
        depositAmount: Number(tenant.depositamount || tenant.deposit_paid || 0),
        paymentHistory: [],
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
        propertyName: propertyName,
        propertyAddress: propertyAddress,
        notes: tenant.notes || '',
      };
    });
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('📝 Creating tenant in Supabase:', tenant);

    const user = await this.ensureAuthenticated();

    // Prepare the insert data with EXACT database field names from your Supabase
    const insertData = {
      landlord_id: user.id,
      name: tenant.name || 'Sin nombre',
      first_name: tenant.name?.split(' ')[0] || 'Sin nombre',
      last_name: tenant.name?.split(' ').slice(1).join(' ') || '',
      email: tenant.email || '',
      phone: tenant.phone || null,
      moveindate: tenant.moveInDate || tenant.lease_start_date || new Date().toISOString().split('T')[0],
      leaseenddate: tenant.leaseEndDate || tenant.lease_end_date || null,
      rent_amount: Number(tenant.rentAmount || tenant.rent_amount || 0),
      monthly_rent: Number(tenant.rentAmount || tenant.rent_amount || 0),
      depositamount: Number(tenant.depositAmount || 0),
      deposit_paid: Number(tenant.depositAmount || 0),
      status: tenant.status || 'active',
      is_active: (tenant.status || 'active') === 'active',
      notes: tenant.notes || '',
      property_id: (tenant as any).propertyId || tenant.property_id || null
    };

    console.log('📋 Insert data prepared:', insertData);

    const { data, error } = await this.supabase
      .from('tenants')
      .insert(insertData)
      .select(`
        *,
        properties:property_id(name, address)
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

    // Get property info from the join
    const propertyInfo = data.properties;
    const propertyName = propertyInfo?.name || data.property_name || 'Sin propiedad';
    const propertyAddress = propertyInfo?.address || '';
    const fullName = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Sin nombre';

    return {
      id: data.id,
      user_id: data.user_id || data.landlord_id,
      landlord_id: data.landlord_id,
      name: fullName,
      email: data.email || '',
      phone: data.phone || '',
      lease_start_date: data.moveindate || data.move_in_date || '',
      lease_end_date: data.leaseenddate || data.move_out_date || '',
      rent_amount: Number(data.rent_amount || data.monthly_rent || 0),
      status: data.status || (data.is_active ? 'active' : 'inactive'),
      unit_number: '',
      property_id: data.property_id,
      property_name: propertyName,
      created_at: data.created_at,
      updated_at: data.updated_at,

      // Legacy aliases
      unit: 'Sin unidad',
      moveInDate: data.moveindate || data.move_in_date || '',
      leaseEndDate: data.leaseenddate || data.move_out_date || '',
      rentAmount: Number(data.rent_amount || data.monthly_rent || 0),
      depositAmount: Number(data.depositamount || data.deposit_paid || 0),
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: propertyName,
      propertyAddress: propertyAddress,
      notes: data.notes || '',
    };
  }

  async updateTenant(id: string, updates: Partial<Tenant & { propertyId?: string }>): Promise<Tenant> {
    console.log('🔄 Updating tenant in Supabase:', id);
    console.log('📥 Raw updates received:', updates);

    const user = await this.ensureAuthenticated();

    // Prepare update data with EXACT database field names from your Supabase
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
      updateData.first_name = updates.name?.split(' ')[0] || 'Sin nombre';
      updateData.last_name = updates.name?.split(' ').slice(1).join(' ') || '';
    }
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.moveInDate !== undefined) updateData.moveindate = updates.moveInDate;
    if (updates.leaseEndDate !== undefined) updateData.leaseenddate = updates.leaseEndDate;
    if (updates.rentAmount !== undefined) {
      updateData.rent_amount = Number(updates.rentAmount);
      updateData.monthly_rent = Number(updates.rentAmount);
    }
    if (updates.depositAmount !== undefined) {
      updateData.depositamount = Number(updates.depositAmount);
      updateData.deposit_paid = Number(updates.depositAmount);
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      updateData.is_active = updates.status === 'active';
    }
    if (updates.propertyId !== undefined) updateData.property_id = updates.propertyId;
    if ((updates as any).property_id !== undefined) updateData.property_id = (updates as any).property_id;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    console.log('📤 Mapped update data for database:', updateData);

    const { data, error } = await this.supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .eq('landlord_id', user.id) // Security check
      .select(`
        *,
        properties:property_id(name, address)
      `)
      .single();

    if (error) {
      console.error('❌ Error updating tenant:', error);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    console.log('✅ Updated tenant in database:', data);

    // Update unit assignment if changed
    if (updates.unit !== undefined && updates.propertyId) {
      await this.assignTenantToUnit(id, updates.unit, updates.propertyId);
    }

    // Get property info from the join
    const propertyInfo = data.properties;
    const propertyName = propertyInfo?.name || data.property_name || 'Sin propiedad';
    const propertyAddress = propertyInfo?.address || '';
    const fullName = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Sin nombre';

    const result = {
      id: data.id,
      user_id: data.user_id || data.landlord_id,
      landlord_id: data.landlord_id,
      name: fullName,
      email: data.email || '',
      phone: data.phone || '',
      lease_start_date: data.moveindate || data.move_in_date || '',
      lease_end_date: data.leaseenddate || data.move_out_date || '',
      rent_amount: Number(data.rent_amount || data.monthly_rent || 0),
      status: data.status || (data.is_active ? 'active' : 'inactive'),
      unit_number: '',
      property_id: data.property_id,
      property_name: propertyName,
      created_at: data.created_at,
      updated_at: data.updated_at,

      // Legacy aliases
      unit: 'Sin unidad',
      moveInDate: data.moveindate || data.move_in_date || '',
      leaseEndDate: data.leaseenddate || data.move_out_date || '',
      rentAmount: Number(data.rent_amount || data.monthly_rent || 0),
      depositAmount: Number(data.depositamount || data.deposit_paid || 0),
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: propertyName,
      propertyAddress: propertyAddress,
      notes: data.notes || '',
    };

    console.log('📋 Returning formatted tenant data:', result);
    return result;
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