import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  async getTenants(): Promise<Tenant[]> {
    console.log('Fetching tenants from Supabase...');
    
    const user = await this.ensureAuthenticated();
    
    console.log('🔍 Fetching tenants for landlord:', user.id);
    const { data, error } = await this.supabase
      .from('tenants')
      .select(`
        *,
        units:unit_id (
          unit_number,
          monthly_rent,
          property_id
        )
      `)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    console.log('Fetched tenants:', data);
    
    // Transform database format to app format
    return (data || []).map(tenant => ({
      id: tenant.id,
      name: `${tenant.first_name} ${tenant.last_name}`.trim(),
      email: tenant.email || '',
      phone: tenant.phone || '',
      unit: tenant.units?.unit_number || 'Sin unidad',
      moveInDate: tenant.move_in_date || '',
      leaseEndDate: tenant.move_out_date || '',
      rentAmount: Number(tenant.monthly_rent || tenant.units?.monthly_rent || 0),
      depositAmount: Number(tenant.deposit_paid || 0),
      status: tenant.is_active ? 'active' : 'inactive',
      paymentHistory: [],
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
    }));
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('Creating tenant in Supabase:', tenant);
    
    const user = await this.ensureAuthenticated();
    
    // Split name into first_name and last_name
    const nameParts = tenant.name.trim().split(' ');
    const firstName = nameParts[0] || 'Sin nombre';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const { data, error } = await this.supabase
      .from('tenants')
      .insert({
        landlord_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: tenant.email || null,
        phone: tenant.phone || null,
        move_in_date: tenant.moveInDate || null,
        move_out_date: tenant.leaseEndDate || null,
        monthly_rent: tenant.rentAmount || 0,
        deposit_paid: tenant.depositAmount || 0,
        is_active: tenant.status === 'active',
        notes: tenant.notes || null
        // unit_id: null // Por ahora sin unidad específica
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
      name: `${data.first_name} ${data.last_name}`.trim(),
      email: data.email || '',
      phone: data.phone || '',
      unit: 'Sin unidad', // Por ahora
      moveInDate: data.move_in_date || '',
      leaseEndDate: data.move_out_date || '',
      rentAmount: Number(data.monthly_rent || 0),
      depositAmount: Number(data.deposit_paid || 0),
      status: data.is_active ? 'active' : 'inactive',
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    console.log('Updating tenant in Supabase:', id, updates);
    
    // Split name if provided
    let firstName, lastName;
    if (updates.name) {
      const nameParts = updates.name.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
    
    const { data, error } = await this.supabase
      .from('tenants')
      .update({
        ...(firstName && { first_name: firstName }),
        ...(lastName !== undefined && { last_name: lastName }),
        ...(updates.email && { email: updates.email }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.moveInDate && { move_in_date: updates.moveInDate }),
        ...(updates.leaseEndDate && { move_out_date: updates.leaseEndDate }),
        ...(updates.rentAmount && { monthly_rent: updates.rentAmount }),
        ...(updates.depositAmount && { deposit_paid: updates.depositAmount }),
        ...(updates.status && { is_active: updates.status === 'active' }),
        ...(updates.notes && { notes: updates.notes })
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
      name: `${data.first_name} ${data.last_name}`.trim(),
      email: data.email || '',
      phone: data.phone || '',
      unit: 'Sin unidad',
      moveInDate: data.move_in_date || '',
      leaseEndDate: data.move_out_date || '',
      rentAmount: Number(data.monthly_rent || 0),
      depositAmount: Number(data.deposit_paid || 0),
      status: data.is_active ? 'active' : 'inactive',
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteTenant(id: string): Promise<boolean> {
    console.log('Deleting tenant from Supabase:', id);
    
    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tenant:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }

    return true;
  }
}