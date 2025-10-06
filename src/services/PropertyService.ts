import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./BaseService";

export interface Property {
  id: string;
  landlord_id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  postal_code: string;
  country?: string;
  property_type: string;
  total_units?: number;
  purchase_price?: number;
  current_value?: number;
  purchase_date?: string;
  photos?: string[];
  documents?: string[];
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export class PropertyService extends BaseService {
  async getProperties(): Promise<Property[]> {
    const user = await this.ensureAuthenticated();
    
    console.log('🔍 Fetching properties for landlord:', user.id);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    return data || [];
  }

  async createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'landlord_id'>): Promise<Property> {
    const user = await this.ensureAuthenticated();
    
    const propertyData = {
      landlord_id: user.id,
      name: property.name,
      description: property.description || null,
      address: property.address,
      city: property.city || 'Madrid', // Default
      postal_code: property.postal_code || '28001', // Default
      country: property.country || 'España',
      property_type: property.property_type || 'apartment',
      total_units: property.total_units || 1,
      purchase_price: property.purchase_price || null,
      current_value: property.current_value || null,
      purchase_date: property.purchase_date || null,
      is_active: true
    };

    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      throw error;
    }

    return data;
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      throw error;
    }

    return data;
  }

  async deleteProperty(id: string): Promise<void> {
    const user = await this.ensureAuthenticated();
    
    // First check if property has active tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .eq('property_id', id)
      .eq('status', 'active');

    if (tenantsError) {
      console.error('Error checking tenants:', tenantsError);
      throw tenantsError;
    }

    if (tenants && tenants.length > 0) {
      throw new Error('No se puede eliminar una propiedad con inquilinos activos');
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }
}

export const propertyService = new PropertyService();