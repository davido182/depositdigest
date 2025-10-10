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
          property_id,
          properties (
            name,
            address
          )
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
    return (data || []).map(tenant => {
      const unitNumber = tenant.units?.unit_number || 'Sin unidad';
      const rentAmount = Number(tenant.rent_amount || tenant.units?.monthly_rent || 0);
      const propertyName = tenant.units?.properties?.name || 'Sin propiedad';
      const propertyAddress = tenant.units?.properties?.address || '';

      console.log(`Tenant ${tenant.name}: unit=${unitNumber}, rent=${rentAmount}, property=${propertyName}`);

      return {
        id: tenant.id,
        name: tenant.name || 'Sin nombre',
        email: tenant.email || '',
        phone: tenant.phone || '',
        unit: unitNumber,
        moveInDate: tenant.moveInDate || '',
        leaseEndDate: tenant.leaseEndDate || '',
        rentAmount: rentAmount,
        depositAmount: Number(tenant.depositAmount || 0),
        status: tenant.status || 'active',
        paymentHistory: [],
        createdAt: tenant.created_at,
        // Agregar información de la propiedad
        propertyName: propertyName,
        propertyAddress: propertyAddress,
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
        moveInDate: tenant.moveInDate || null,
        leaseEndDate: tenant.leaseEndDate || null,
        rent_amount: tenant.rentAmount || 0,
        depositAmount: tenant.depositAmount || 0,
        status: tenant.status || 'active',
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
      unit: 'Sin unidad',
      moveInDate: data.moveInDate || '',
      leaseEndDate: data.leaseEndDate || '',
      rentAmount: Number(data.rent_amount || 0),
      depositAmount: Number(data.depositAmount || 0),
      status: data.status || 'active',
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
        ...(updates.moveInDate && { moveInDate: updates.moveInDate }),
        ...(updates.leaseEndDate && { leaseEndDate: updates.leaseEndDate }),
        ...(updates.rentAmount && { rent_amount: updates.rentAmount }),
        ...(updates.depositAmount && { depositAmount: updates.depositAmount }),
        ...(updates.status && { status: updates.status }),
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
      unit: 'Sin unidad', // Simplificado por ahora
      moveInDate: data.moveInDate || '',
      leaseEndDate: data.leaseEndDate || '',
      rentAmount: Number(data.rent_amount || 0),
      depositAmount: Number(data.depositAmount || 0),
      status: data.status || 'active',
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