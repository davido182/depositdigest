import { SupabaseService } from "./SupabaseService";
import { supabase } from "@/integrations/supabase/client";

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  tenant_id?: string | null;
  rent_amount?: number | null;
  is_available: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export class UnitsService extends SupabaseService {
  async getUnits(propertyId?: string): Promise<Unit[]> {
    const user = await this.ensureAuthenticated();
    
    let query = supabase
      .from('units')
      .select('*');
    
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
    
    const { data, error } = await query.order('unit_number');
    
    if (error) {
      console.error('Error fetching units:', error);
      throw error;
    }
    
    return data || [];
  }

  async createUnit(unit: Omit<Unit, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('units')
      .insert({

        property_id: unit.property_id,
        unit_number: unit.unit_number,
        tenant_id: unit.tenant_id,
        rent_amount: unit.rent_amount,
        is_available: unit.is_available
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating unit:', error);
      throw error;
    }
    
    return data.id;
  }

  async updateUnit(id: string, updates: Partial<Unit>): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const { error } = await supabase
      .from('units')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating unit:', error);
      throw error;
    }
    
    return true;
  }

  async deleteUnit(id: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
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

  async assignTenant(unitId: string, tenantId: string, rentAmount: number): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const { error } = await supabase
      .from('units')
      .update({
        tenant_id: tenantId,
        rent_amount: rentAmount,
        is_available: false
      })
      .eq('id', unitId);
    
    if (error) {
      console.error('Error assigning tenant:', error);
      throw error;
    }
    
    return true;
  }

  async unassignTenant(unitId: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const { error } = await supabase
      .from('units')
      .update({
        tenant_id: null,
        rent_amount: null,
        is_available: true
      })
      .eq('id', unitId);
    
    if (error) {
      console.error('Error unassigning tenant:', error);
      throw error;
    }
    
    return true;
  }
}

export const unitsService = new UnitsService();
