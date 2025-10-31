import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./BaseService";
import { Unit } from "@/types/index";

export class UnitService extends BaseService {
  async getUnitsByProperty(propertyId: string): Promise<Unit[]> {
    const user = await this.ensureAuthenticated();
    
    // Removed console.log for security
    
    // First verify the property belongs to the user
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('landlord_id', user.id)
      .single();

    if (propertyError || !property) {
      throw new Error('Property not found or access denied');
    }

    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        tenants:tenant_id(id, name, first_name, last_name, email, status)
      `)
      .eq('property_id', propertyId)
      .order('unit_number');

    if (error) {
      console.error('Error fetching units:', error);
      throw error;
    }

    // Transform data to include tenant information
    return (data || []).map(unit => {
      const tenantName = unit.tenants?.name || 
                        `${unit.tenants?.first_name || ''} ${unit.tenants?.last_name || ''}`.trim() || 
                        null;
      
      return {
        ...unit,
        tenant_name: tenantName,
        tenant_email: unit.tenants?.email || null,
        tenant_status: unit.tenants?.status || null,
      };
    });
  }

  async createUnit(unit: Omit<Unit, 'id' | 'created_at' | 'updated_at'>): Promise<Unit> {
    const user = await this.ensureAuthenticated();
    
    // Verify property belongs to user
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', unit.property_id)
      .eq('landlord_id', user.id)
      .single();

    if (propertyError || !property) {
      throw new Error('Property not found or access denied');
    }

    // Removed console.log for security

    const { data, error } = await supabase
      .from('units')
      .insert({
        property_id: unit.property_id,
        unit_number: unit.unit_number,
        monthly_rent: unit.monthly_rent || unit.rent_amount || 0,
        is_available: unit.is_available !== false,
        tenant_id: unit.tenant_id || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating unit:', error);
      throw error;
    }

    // Removed console.log for security
    return data;
  }

  async updateUnit(id: string, updates: Partial<Unit>): Promise<Unit> {
    const user = await this.ensureAuthenticated();
    
    // Verify unit belongs to user through property relationship
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select(`
        *,
        properties!inner(landlord_id)
      `)
      .eq('id', id)
      .eq('properties.landlord_id', user.id)
      .single();

    if (unitError || !unit) {
      throw new Error('Unit not found or access denied');
    }

    // Removed console.log for security
    
    const updatePayload = {
      ...(updates.unit_number && { unit_number: updates.unit_number }),
      ...(updates.monthly_rent !== undefined && { monthly_rent: updates.monthly_rent }),
      ...(updates.rent_amount !== undefined && { monthly_rent: updates.rent_amount }),
      ...(updates.is_available !== undefined && { is_available: updates.is_available }),
      ...(updates.tenant_id !== undefined && { tenant_id: updates.tenant_id })
    };
    
    // Removed console.log for security

    const { data, error } = await supabase
      .from('units')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating unit:', error);
      throw error;
    }

    return data;
  }

  async deleteUnit(id: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    // Verify unit belongs to user through property relationship
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select(`
        *,
        properties!inner(landlord_id)
      `)
      .eq('id', id)
      .eq('properties.landlord_id', user.id)
      .single();

    if (unitError || !unit) {
      throw new Error('Unit not found or access denied');
    }

    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting unit:', error);
      throw error;
    }

    return true;
  }
}

export const unitService = new UnitService();
