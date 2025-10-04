import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./BaseService";

export interface Property {
  id: string;
  user_id: string;
  name: string;
  address: string;
  total_units: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export class PropertyService extends BaseService {
  async getProperties(): Promise<Property[]> {
    const user = await this.ensureAuthenticated();
    
    console.log('🔍 Fetching ALL properties from database...');
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    return data || [];
  }

  async createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Property> {
    const user = await this.ensureAuthenticated();
    
    const propertyData = {
      name: property.name,
      address: property.address,
      total_units: property.total_units,
      description: property.description
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