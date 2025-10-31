import { supabase } from "@/integrations/supabase/client";

export async function debugDatabaseStructure() {
  // Removed console.log for security
  
  try {
    // Intentar obtener un registro de cada tabla para ver su estructura
    // Removed console.log for security
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);
    
    if (tenantsError) {
      console.error('Error tenants:', tenantsError);
    } else {
      // Removed console.log for security : 'Tabla vacía');
      // Removed console.log for security
    }

    // Removed console.log for security
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    if (propertiesError) {
      console.error('Error properties:', propertiesError);
    } else {
      // Removed console.log for security : 'Tabla vacía');
      // Removed console.log for security
    }

    // Removed console.log for security
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    if (paymentsError) {
      console.error('Error payments:', paymentsError);
    } else {
      // Removed console.log for security : 'Tabla vacía');
      // Removed console.log for security
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}
