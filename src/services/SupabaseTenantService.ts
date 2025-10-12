import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  // Test method to verify database connection and structure
  async testConnection(): Promise<void> {
    try {
      const user = await this.ensureAuthenticated();
      console.log('🔍 Testing database connection for user:', user.id);

      // Test basic query
      const { data, error } = await this.supabase
        .from('tenants')
        .select('*')
        .eq('landlord_id', user.id)
        .limit(1);

      if (error) {
        console.error('❌ Database connection test failed:', error);
        throw error;
      }

      console.log('✅ Database connection test successful. Found tenants:', data?.length || 0);

      // Test table structure
      const { data: tableInfo, error: tableError } = await this.supabase
        .from('tenants')
        .select('*')
        .limit(0);

      if (tableError) {
        console.error('❌ Table structure test failed:', tableError);
      } else {
        console.log('✅ Table structure accessible');
      }

    } catch (error) {
      console.error('❌ Connection test error:', error);
      throw error;
    }
  }

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

    // Transform database format to app format using REAL database fields
    return (data || []).map(tenant => {
      console.log(`📋 Processing tenant ${tenant.name}: rent=${tenant.rent_amount}`);

      // Get property info from the join
      const propertyInfo = tenant.properties;
      const propertyName = propertyInfo?.name || 'Sin propiedad';
      const propertyAddress = propertyInfo?.address || '';

      // Find the unit assigned to this tenant
      const assignedUnit = unitsData?.find(unit => unit.tenant_id === tenant.id);
      const unitNumber = assignedUnit?.unit_number || 'Sin unidad';

      return {
        id: tenant.id,
        user_id: tenant.landlord_id, // Use landlord_id as user_id for compatibility
        landlord_id: tenant.landlord_id,
        name: tenant.name || 'Sin nombre',
        email: tenant.email || '',
        phone: tenant.phone || '',
        lease_start_date: tenant.moveInDate || '', // DB field is moveInDate
        lease_end_date: tenant.leaseEndDate || '', // DB field is leaseEndDate
        rent_amount: Number(tenant.rent_amount || 0), // DB field is rent_amount
        status: tenant.status || 'active',
        unit_number: unitNumber,
        property_id: tenant.property_id,
        property_name: propertyName,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,

        // Legacy aliases for forms (using DB field names)
        unit: unitNumber,
        moveInDate: tenant.moveInDate || '',
        leaseEndDate: tenant.leaseEndDate || '',
        rentAmount: Number(tenant.rent_amount || 0),
        depositAmount: Number(tenant.depositAmount || 0), // DB field is depositAmount
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

    // Prepare the insert data with REAL database field names from migration
    const insertData = {
      landlord_id: user.id,
      name: tenant.name || 'Sin nombre',
      email: tenant.email || '',
      phone: tenant.phone || null,
      moveInDate: tenant.moveInDate || tenant.lease_start_date || new Date().toISOString().split('T')[0],
      leaseEndDate: tenant.leaseEndDate || tenant.lease_end_date || null,
      rent_amount: Number(tenant.rentAmount || tenant.rent_amount || 0),
      depositAmount: Number(tenant.depositAmount || 0),
      status: tenant.status || 'active',
      notes: tenant.notes || '',
      property_id: (tenant as any).propertyId || tenant.property_id || null
    };

    console.log('📋 Insert data prepared:', insertData);

    console.log('📤 Insert data:', insertData);

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

    return {
      id: data.id,
      user_id: data.landlord_id,
      landlord_id: data.landlord_id,
      name: data.name || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || '',
      lease_start_date: data.moveInDate || '',
      lease_end_date: data.leaseEndDate || '',
      rent_amount: Number(data.rent_amount || 0),
      status: data.status,
      unit_number: '',
      property_id: data.property_id,
      property_name: '',
      created_at: data.created_at,
      updated_at: data.updated_at,

      // Legacy aliases
      unit: 'Sin unidad',
      moveInDate: data.moveInDate || '',
      leaseEndDate: data.leaseEndDate || '',
      rentAmount: Number(data.rent_amount || 0),
      depositAmount: Number(data.depositAmount || 0),
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: 'Sin propiedad',
      propertyAddress: '',
      notes: data.notes || '',
    };
  }

  async updateTenant(id: string, updates: Partial<Tenant & { propertyId?: string }>): Promise<Tenant> {
    console.log('🔄 Updating tenant in Supabase:', id);
    console.log('📥 Raw updates received:', updates);

    const user = await this.ensureAuthenticated();

    // Prepare update data with REAL database field names from migration
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
    const propertyName = propertyInfo?.name || 'Sin propiedad';
    const propertyAddress = propertyInfo?.address || '';

    const result = {
      id: data.id,
      user_id: data.landlord_id,
      landlord_id: data.landlord_id,
      name: data.name || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || '',
      lease_start_date: data.moveInDate || '',
      lease_end_date: data.leaseEndDate || '',
      rent_amount: Number(data.rent_amount || 0),
      status: data.status,
      unit_number: '',
      property_id: data.property_id,
      property_name: propertyName,
      created_at: data.created_at,
      updated_at: data.updated_at,

      // Legacy aliases
      unit: 'Sin unidad',
      moveInDate: data.moveInDate || '',
      leaseEndDate: data.leaseEndDate || '',
      rentAmount: Number(data.rent_amount || 0),
      depositAmount: Number(data.depositAmount || 0),
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