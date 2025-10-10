import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./BaseService";

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  monthly_rent: number; // Para compatibilidad con la interfaz
  rent_amount?: number; // Campo real de la BD
  is_available: boolean;
  tenant_id?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export class UnitService extends BaseService {
  async getUnitsByProperty(propertyId: string): Promise<Unit[]> {
    const user = await this.ensureAuthenticated();
    
    console.log('🔍 Fetching units for property:', propertyId);
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('property_id', propertyId)
      .eq('user_id', user.id)
      .order('unit_number');

    if (error) {
      console.error('Error fetching units:', error);
      throw error;
    }

    // Transform data to match interface
    return (data || []).map(unit => ({
      ...unit,
      monthly_rent: unit.rent_amount || 0 // Mapear rent_amount a monthly_rent
    }));
  }

  async createUnit(unit: Omit<Unit, 'id' | 'created_at' | 'updated_at'>): Promise<Unit> {
    const user = await this.ensureAuthenticated();
    
    // Verify property belongs to user
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', unit.property_id)
      .eq('user_id', user.id)
      .single();

    if (propertyError || !property) {
      throw new Error('Property not found or access denied');
    }

    console.log('📝 Creating new unit:', unit);

    const { data, error } = await supabase
      .from('units')
      .insert({
        property_id: unit.property_id,
        unit_number: unit.unit_number,
        rent_amount: unit.monthly_rent || 0,
        is_available: unit.is_available !== false,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating unit:', error);
      throw error;
    }

    console.log('✅ Unit created:', data);
    return {
      ...data,
      monthly_rent: data.rent_amount || 0
    };
  }

  async updateUnit(id: string, updates: Partial<Unit>): Promise<Unit> {
    const user = await this.ensureAuthenticated();
    
    // Verify unit belongs to user
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (unitError || !unit) {
      throw new Error('Unit not found or access denied');
    }

    console.log('🔄 Updating unit with data:', updates);
    
    const updatePayload = {
      ...(updates.unit_number && { unit_number: updates.unit_number }),
      ...(updates.monthly_rent !== undefined && { rent_amount: updates.monthly_rent }),
      ...(updates.is_available !== undefined && { is_available: updates.is_available }),
      ...(updates.tenant_id !== undefined && { tenant_id: updates.tenant_id })
    };
    
    console.log('🔄 Update payload:', updatePayload);

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

    return {
      ...data,
      monthly_rent: data.rent_amount || 0
    };
  }

  async deleteUnit(id: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    // Verify unit belongs to user
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
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