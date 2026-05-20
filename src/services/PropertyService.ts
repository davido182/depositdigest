import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./BaseService";
import { Property, normalizeProperty, normalizeArray } from '@/types/database';

export class PropertyService extends BaseService {
  async getProperties(): Promise<Property[]> {
    const user = await this.ensureAuthenticated();
    
    // Fetching properties for authenticated landlord
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    // Normalize properties using hybrid types
    return normalizeArray(data || [], normalizeProperty);
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
      total_units: property.total_units || property.units || 1,
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

    // Las unidades se crearán manualmente desde "Gestionar Unidades"
    // Removed console.log for security`);

    return normalizeProperty(data);
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

    return normalizeProperty(data);
  }

  async deleteProperty(id: string): Promise<void> {
    const user = await this.ensureAuthenticated();
    
    // Verify property belongs to user
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name')
      .eq('id', id)
      .eq('landlord_id', user.id)
      .single();

    if (propertyError || !property) {
      throw new Error('Propiedad no encontrada o sin permisos');
    }

    // Check if property has active tenants
    const { data: activeTenants, error: tenantsCheckError } = await supabase
      .from('tenants')
      .select('id')
      .eq('property_id', id)
      .eq('is_active', true);

    if (tenantsCheckError) {
      console.error('Error checking tenants:', tenantsCheckError);
      throw new Error('Error al verificar inquilinos activos');
    }

    if (activeTenants && activeTenants.length > 0) {
      throw new Error('No se puede eliminar una propiedad con inquilinos activos');
    }

    // Delete units first (cascade should handle this, but let's be explicit)
    const { error: unitsDeleteError } = await supabase
      .from('units')
      .delete()
      .eq('property_id', id);

    if (unitsDeleteError) {
      console.error('Error deleting units:', unitsDeleteError);
      // Continue anyway, cascade should handle it
    }

    // Delete property
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('landlord_id', user.id);

    if (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }
}

export const propertyService = new PropertyService();
