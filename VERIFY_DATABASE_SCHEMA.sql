-- Verificar el esquema de las tablas para confirmar nombres de campos

-- Ver estructura de la tabla tenants
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- Ver estructura de la tabla units
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'units'
ORDER BY ordinal_position;

-- Ver algunos datos de ejemplo para confirmar
SELECT 
    'tenants' as table_name,
    column_name
FROM information_schema.columns
WHERE table_name = 'tenants' 
AND column_name LIKE '%rent%';

SELECT 
    'units' as table_name,
    column_name
FROM information_schema.columns
WHERE table_name = 'units' 
AND column_name LIKE '%rent%';