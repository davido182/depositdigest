
import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  async getTenants(): Promise<Tenant[]> {
    console.log('Fetching tenants from Supabase...');
    
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    console.log('Fetched tenants:', data);
    
    // Transform database format to app format
    return (data || []).map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || '',
      unit: tenant.unit_number,
      moveInDate: tenant.lease_start_date,
      leaseEndDate: tenant.lease_end_date || '',
      rentAmount: Number(tenant.rent_amount),
      depositAmount: Number(tenant.rent_amount), // Assuming deposit equals rent
      status: tenant.status as 'active' | 'inactive',
      paymentHistory: [],
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
    }));
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('Creating tenant in Supabase:', tenant);
    
    const { data, error } = await this.supabase
      .from('tenants')
      .insert({
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone || null,
        unit_number: tenant.unit,
        lease_start_date: tenant.moveInDate,
        lease_end_date: tenant.leaseEndDate || null,
        rent_amount: tenant.rentAmount,
        status: tenant.status,
        user_id: (await this.supabase.auth.getUser()).data.user?.id!,
        landlord_id: (await this.supabase.auth.getUser()).data.user?.id!,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    console.log('Created tenant:', data);

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      unit: data.unit_number,
      moveInDate: data.lease_start_date,
      leaseEndDate: data.lease_end_date || '',
      rentAmount: Number(data.rent_amount),
      depositAmount: Number(data.rent_amount),
      status: data.status as 'active' | 'inactive',
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    console.log('Updating tenant in Supabase:', id, updates);
    
    const { data, error } = await this.supabase
      .from('tenants')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone || null,
        unit_number: updates.unit,
        lease_start_date: updates.moveInDate,
        lease_end_date: updates.leaseEndDate || null,
        rent_amount: updates.rentAmount,
        status: updates.status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant:', error);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      unit: data.unit_number,
      moveInDate: data.lease_start_date,
      leaseEndDate: data.lease_end_date || '',
      rentAmount: Number(data.rent_amount),
      depositAmount: Number(data.rent_amount),
      status: data.status as 'active' | 'inactive',
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteTenant(id: string): Promise<void> {
    console.log('Deleting tenant from Supabase:', id);
    
    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tenant:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }
}
