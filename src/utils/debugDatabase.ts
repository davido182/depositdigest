import { supabase } from "@/integrations/supabase/client";

export async function debugDatabaseStructure() {
  console.log('🔍 Verificando estructura real de la base de datos...');
  
  try {
    // Intentar obtener un registro de cada tabla para ver su estructura
    console.log('\n📋 TENANTS:');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);
    
    if (tenantsError) {
      console.error('Error tenants:', tenantsError);
    } else {
      console.log('Estructura tenants:', tenants?.[0] ? Object.keys(tenants[0]) : 'Tabla vacía');
      console.log('Datos tenants:', tenants);
    }

    console.log('\n🏠 PROPERTIES:');
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    if (propertiesError) {
      console.error('Error properties:', propertiesError);
    } else {
      console.log('Estructura properties:', properties?.[0] ? Object.keys(properties[0]) : 'Tabla vacía');
      console.log('Datos properties:', properties);
    }

    console.log('\n💰 PAYMENTS:');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    if (paymentsError) {
      console.error('Error payments:', paymentsError);
    } else {
      console.log('Estructura payments:', payments?.[0] ? Object.keys(payments[0]) : 'Tabla vacía');
      console.log('Datos payments:', payments);
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}