import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./BaseService";

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  monthly_rent: number;
  deposit_amount?: number;
  is_furnished?: boolean;
  is_available: boolean;
  description?: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export class UnitService extends BaseService {
  async getUnitsByProperty(propertyId: string): Promise<Unit[]> {
    const user = await this.ensureAuthenticated();
    
    console.log('🔍 Fetching units for property:', propertyId);
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        properties!inner(landlord_id)
      `)
      .eq('property_id', propertyId)
      .eq('properties.landlord_id', user.id)
      .order('unit_number');

    if (error) {
      console.error('Error fetching units:', error);
      throw error;
    }

    return data || [];
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

    const { data, error } = await supabase
      .from('units')
      .insert({
        property_id: unit.property_id,
        unit_number: unit.unit_number,
        bedrooms: unit.bedrooms || 1,
        bathrooms: unit.bathrooms || 1,
        square_meters: unit.square_meters || null,
        monthly_rent: unit.monthly_rent,
        deposit_amount: unit.deposit_amount || null,
        is_furnished: unit.is_furnished || false,
        is_available: unit.is_available !== false, // Default true
        description: unit.description || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating unit:', error);
      throw error;
    }

    console.log('✅ Unit created:', data);
    return data;
  }

  async updateUnit(id: string, updates: Partial<Unit>): Promise<Unit> {
    const user = await this.ensureAuthenticated();
    
    // Verify unit belongs to user's property
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

    const { data, error } = await supabase
      .from('units')
      .update({
        ...(updates.unit_number && { unit_number: updates.unit_number }),
        ...(updates.bedrooms && { bedrooms: updates.bedrooms }),
        ...(updates.bathrooms && { bathrooms: updates.bathrooms }),
        ...(updates.square_meters && { square_meters: updates.square_meters }),
        ...(updates.monthly_rent && { monthly_rent: updates.monthly_rent }),
        ...(updates.deposit_amount !== undefined && { deposit_amount: updates.deposit_amount }),
        ...(updates.is_furnished !== undefined && { is_furnished: updates.is_furnished }),
        ...(updates.is_available !== undefined && { is_available: updates.is_available }),
        ...(updates.description !== undefined && { description: updates.description })
      })
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
    
    // Verify unit belongs to user's property
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