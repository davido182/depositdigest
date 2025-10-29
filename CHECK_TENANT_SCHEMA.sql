-- Verificar el esquema real de la tabla tenants
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- Verificar datos de ejemplo
SELECT id, name, email, phone, status, 
       lease_start_date, lease_end_date, rent_amount,
       property_id, property_name, unit_number,
       created_at, updated_at
FROM tenants 
LIMIT 3;

-- Verificar el esquema de la tabla units
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'units' 
ORDER BY ordinal_position;

-- Verificar datos de unidades
SELECT id, unit_number, property_id, is_available, rent_amount
FROM units 
LIMIT 5;