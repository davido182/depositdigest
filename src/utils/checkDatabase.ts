import { supabase } from "@/integrations/supabase/client";

export const checkTenantsTable = async () => {
  try {
    // Intentar obtener la estructura de la tabla
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error checking tenants table:', error);
      return null;
    }

    console.log('Tenants table structure:', data);
    
    // Si hay datos, mostrar las columnas
    if (data && data.length > 0) {
      console.log('Available columns:', Object.keys(data[0]));
      return Object.keys(data[0]);
    }

    // Si no hay datos, intentar insertar un registro de prueba para ver qué columnas acepta
    const testTenant = {
      name: 'Test',
      email: 'test@test.com',
      user_id: 'test'
    };

    const { error: insertError } = await supabase
      .from('tenants')
      .insert([testTenant])
      .select();

    if (insertError) {
      console.log('Insert error (this helps us understand the schema):', insertError);
    }

    return null;
  } catch (error) {
    console.error('Error in checkTenantsTable:', error);
    return null;
  }
};

// Función para probar diferentes estructuras de columnas
export const testTenantInsert = async (userId: string) => {
  const testCases = [
    { name: 'Test 1', email: 'test1@test.com', user_id: userId },
    { full_name: 'Test 2', email: 'test2@test.com', user_id: userId },
    { tenant_name: 'Test 3', email: 'test3@test.com', user_id: userId }
  ];

  for (const testCase of testCases) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert([testCase])
        .select();

      if (!error) {
        console.log('✅ Successful insert with structure:', testCase);
        // Limpiar el registro de prueba
        if (data && data[0]) {
          await supabase.from('tenants').delete().eq('id', data[0].id);
        }
        return Object.keys(testCase);
      } else {
        console.log('❌ Failed insert:', testCase, error.message);
      }
    } catch (err) {
      console.log('💥 Exception:', testCase, err);
    }
  }

  return null;
};