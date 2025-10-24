-- VERIFICAR CAMPOS REALES DE LA TABLA TENANTS
-- Ejecutar en Supabase SQL Editor

-- Ver estructura completa de la tabla tenants
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- Ver un registro de ejemplo para ver qué campos tienen datos
SELECT * FROM tenants 
WHERE landlord_id = '18eaaefa-169b-4d7d-978f-7dcde085def3'
LIMIT 1;