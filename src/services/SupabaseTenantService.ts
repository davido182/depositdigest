import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  async getTenants(): Promise<Tenant[]> {
    console.log('🔍 Fetching tenants from Supabase...');

    const user = await this.ensureAuthenticated();
    console.log('👤 User authenticated:', user.id);

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

    // Show structure of first tenant
    console.log('🔍 First tenant structure:', Object.keys(data[0]));
    console.log('🔍 First tenant data:', data[0]);

    // Simple transformation - just map the basic fields
    return data.map(tenant => {
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
        unit_number: 'Sin unidad',
        property_id: tenant.property_id,
        property_name: tenant.property_name || 'Sin propiedad',
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,
        
        // Legacy aliases for forms
        unit: 'Sin unidad',
        moveInDate: tenant.moveindate || tenant.move_in_date || '',
        leaseEndDate: tenant.leaseenddate || tenant.move_out_date || '',
        rentAmount: Number(tenant.rent_amount || tenant.monthly_rent || 0),
        depositAmount: Number(tenant.depositamount || tenant.deposit_paid || 0),
        paymentHistory: [],
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
        propertyName: tenant.property_name || 'Sin propiedad',
        propertyAddress: '',
        notes: tenant.notes || '',
      };
    });
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('📝 Creating tenant in Supabase:', tenant);

    const user = await this.ensureAuthenticated();

    // Use only the basic required fields first
    const insertData = {
      landlord_id: user.id,
      first_name: tenant.name?.split(' ')[0] || 'Sin nombre',
      last_name: tenant.name?.split(' ').slice(1).join(' ') || '',
      email: tenant.email || '',
      phone: tenant.phone || null,
    };

    console.log('📋 Insert data prepared:', insertData);

    const { data, error } = await this.supabase
      .from('tenants')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    console.log('✅ Created tenant:', data);

    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Sin nombre';

    return {
      id: data.id,
      user_id: data.user_id || data.landlord_id,
      landlord_id: data.landlord_id,
      name: fullName,
      email: data.email || '',
      phone: data.phone || '',
      lease_start_date: '',
      lease_end_date: '',
      rent_amount: 0,
      status: 'active',
      unit_number: '',
      property_id: data.property_id,
      property_name: 'Sin propiedad',
      created_at: data.created_at,
      updated_at: data.updated_at,
      
      // Legacy aliases
      unit: 'Sin unidad',
      moveInDate: '',
      leaseEndDate: '',
      rentAmount: 0,
      depositAmount: 0,
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: 'Sin propiedad',
      propertyAddress: '',
      notes: '',
    };
  }

  async updateTenant(id: string, updates: Partial<Tenant & { propertyId?: string }>): Promise<Tenant> {
    console.log('🔄 Updating tenant in Supabase:', id);
    console.log('📥 Raw updates received:', updates);

    const user = await this.ensureAuthenticated();

    // Use only basic fields for now
    const updateData: any = {};
    
    if (updates.name !== undefined) {
      updateData.first_name = updates.name?.split(' ')[0] || 'Sin nombre';
      updateData.last_name = updates.name?.split(' ').slice(1).join(' ') || '';
    }
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;

    console.log('📤 Mapped update data for database:', updateData);

    const { data, error } = await this.supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .eq('landlord_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error updating tenant:', error);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    console.log('✅ Updated tenant in database:', data);

    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Sin nombre';

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
      property_name: data.property_name || 'Sin propiedad',
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
      propertyName: data.property_name || 'Sin propiedad',
      propertyAddress: '',
      notes: data.notes || '',
    };

    console.log('📋 Returning formatted tenant data:', result);
    return result;
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