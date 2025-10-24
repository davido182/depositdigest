-- VERIFICAR ESQUEMA DE BASE DE DATOS
-- Ejecutar en Supabase SQL Editor

-- 1. Ver estructura de tabla tenants
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- 2. Ver estructura de tabla units
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'units'
ORDER BY ordinal_position;

-- 3. Ver estructura de tabla properties
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;

-- 4. Ver datos de ejemplo de tenants
SELECT 
    id,
    name,
    property_id,
    property_name,
    landlord_id
FROM tenants 
WHERE landlord_id = '18eaaefa-169b-4d7d-978f-7dcde085def3'
LIMIT 5;

-- 5. Ver datos de ejemplo de units
SELECT 
    id,
    unit_number,
    tenant_id,
    property_id,
    is_available
FROM units 
WHERE property_id IN (
    SELECT id FROM properties WHERE user_id = '18eaaefa-169b-4d7d-978f-7dcde085def3'
)
LIMIT 5;

-- 6. Ver relación entre tenants y units
SELECT 
    t.name as tenant_name,
    t.property_id as tenant_property_id,
    t.property_name as tenant_property_name,
    u.unit_number,
    u.tenant_id,
    u.property_id as unit_property_id,
    p.name as property_name_from_table
FROM tenants t
LEFT JOIN units u ON u.tenant_id = t.id
LEFT JOIN properties p ON p.id = t.property_id
WHERE t.landlord_id = '18eaaefa-169b-4d7d-978f-7dcde085def3'
ORDER BY t.name;