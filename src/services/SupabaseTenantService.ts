import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  async getTenants(): Promise<Tenant[]> {
    console.log('Fetching tenants from Supabase...');

    const user = await this.ensureAuthenticated();

    console.log('🔍 Fetching tenants for landlord:', user.id);
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    console.log('Fetched tenants:', data);

    // Transform database format to app format
    return (data || []).map(tenant => {
      console.log(`Tenant ${tenant.name}: rent=${tenant.monthly_rent}`);

      return {
        id: tenant.id,
        name: tenant.name || 'Sin nombre',
        email: tenant.email || '',
        phone: tenant.phone || '',
        unit: tenant.unit_number || 'Sin unidad',
        moveInDate: tenant.lease_start_date || '',
        leaseEndDate: tenant.lease_end_date || '',
        rentAmount: Number(tenant.monthly_rent || 0),
        depositAmount: Number(tenant.deposit_paid || 0),
        status: (tenant.is_active ? 'active' : 'inactive') as any,
        paymentHistory: [],
        createdAt: tenant.created_at,
        propertyName: tenant.property_name || 'Sin propiedad',
        propertyAddress: '',
        updatedAt: tenant.updated_at,
      };
    });
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('Creating tenant in Supabase:', tenant);

    const user = await this.ensureAuthenticated();

    const { data, error } = await this.supabase
      .from('tenants')
      .insert({
        landlord_id: user.id,
        name: tenant.name || 'Sin nombre',
        email: tenant.email || null,
        phone: tenant.phone || null,
        lease_start_date: tenant.moveInDate || null,
        lease_end_date: tenant.leaseEndDate || null,
        monthly_rent: tenant.rentAmount || 0,
        deposit_paid: tenant.depositAmount || 0,
        is_active: tenant.status === 'active',
        notes: tenant.notes || null
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
      name: data.name || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || '',
      unit: data.unit_number || 'Sin unidad',
      moveInDate: data.lease_start_date || '',
      leaseEndDate: data.lease_end_date || '',
      rentAmount: Number(data.monthly_rent || 0),
      depositAmount: Number(data.deposit_paid || 0),
      status: (data.is_active ? 'active' : 'inactive') as any,
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateTenant(id: string, updates: Partial<Tenant & { propertyId?: string }>): Promise<Tenant> {
    console.log('Updating tenant in Supabase:', id, updates);

    const { data, error } = await this.supabase
      .from('tenants')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.moveInDate && { lease_start_date: updates.moveInDate }),
        ...(updates.leaseEndDate && { lease_end_date: updates.leaseEndDate }),
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
      name: data.name || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || '',
      unit: data.unit_number || 'Sin unidad',
      moveInDate: data.lease_start_date || '',
      leaseEndDate: data.lease_end_date || '',
      rentAmount: Number(data.monthly_rent || 0),
      depositAmount: Number(data.deposit_paid || 0),
      status: (data.is_active ? 'active' : 'inactive') as any,
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