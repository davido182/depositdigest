
import { supabase } from "@/integrations/supabase/client";
import { SupabaseService } from "./SupabaseService";
import { Tenant } from "@/types";

export class SupabaseTenantService extends SupabaseService {
  async getTenants(): Promise<Tenant[]> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tenants:', error);
      throw error;
    }

    return data.map(this.mapSupabaseTenantToTenant);
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching tenant:', error);
      throw error;
    }

    return this.mapSupabaseTenantToTenant(data);
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = await this.ensureAuthenticated();
    
    const tenantData = {
      user_id: user.id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || null,
      unit_number: tenant.unit,
      rent_amount: tenant.rentAmount,
      lease_start_date: tenant.moveInDate,
      lease_end_date: tenant.leaseEndDate,
      status: tenant.status
    };

    const { data, error } = await supabase
      .from('tenants')
      .insert(tenantData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }

    return data!.id;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.unit) updateData.unit_number = updates.unit;
    if (updates.rentAmount !== undefined) updateData.rent_amount = updates.rentAmount;
    if (updates.moveInDate) updateData.lease_start_date = updates.moveInDate;
    if (updates.leaseEndDate) updateData.lease_end_date = updates.leaseEndDate;
    if (updates.status) updateData.status = updates.status;

    const { error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating tenant:', error);
      throw error;
    }

    return true;
  }

  async deleteTenant(id: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting tenant:', error);
      throw error;
    }

    return true;
  }

  private mapSupabaseTenantToTenant(data: any): Tenant {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      unit: data.unit_number,
      moveInDate: data.lease_start_date,
      leaseEndDate: data.lease_end_date,
      rentAmount: parseFloat(data.rent_amount),
      depositAmount: 0,
      status: data.status as Tenant['status'],
      paymentHistory: [],
      notes: '',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
