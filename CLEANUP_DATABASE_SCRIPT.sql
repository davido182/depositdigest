-- Script SQL para limpiar datos inconsistentes en Supabase
-- EJECUTAR CON CUIDADO - SOLO PARA TU USUARIO

-- 1. Ver el estado actual de tus datos (reemplaza con tu user_id)
SELECT 
    t.id,
    t.name,
    t.landlord_id,
    t.property_name,
    u.unit_number,
    u.tenant_id,
    p.name as property_from_table
FROM tenants t
LEFT JOIN units u ON u.tenant_id = t.id
LEFT JOIN properties p ON p.id = t.property_id
WHERE t.landlord_id = 'TU_USER_ID_AQUI'  -- REEMPLAZA CON TU USER_ID
ORDER BY t.name;

-- 2. Eliminar inquilinos con nombre NULL (solo tuyos)
DELETE FROM tenants 
WHERE name IS NULL 
AND landlord_id = 'TU_USER_ID_AQUI';  -- REEMPLAZA CON TU USER_ID

-- 3. Limpiar asignaciones de unidades huérfanas
-- Primero, desasignar unidades que apuntan a inquilinos que no existen
UPDATE units 
SET tenant_id = NULL, is_available = true
WHERE tenant_id IS NOT NULL 
AND tenant_id NOT IN (
    SELECT id FROM tenants WHERE landlord_id = 'TU_USER_ID_AQUI'
)
AND property_id IN (
    SELECT id FROM properties WHERE user_id = 'TU_USER_ID_AQUI'
);

-- 4. Verificar inquilinos duplicados (mismo nombre y email)
SELECT 
    name, 
    email, 
    COUNT(*) as count
FROM tenants 
WHERE landlord_id = 'TU_USER_ID_AQUI'
GROUP BY name, email 
HAVING COUNT(*) > 1;

-- 5. Si hay duplicados, mantener solo el más reciente
-- (EJECUTAR SOLO SI EL QUERY ANTERIOR MUESTRA DUPLICADOS)
WITH duplicates AS (
    SELECT 
        id,
        name,
        email,
        ROW_NUMBER() OVER (PARTITION BY name, email ORDER BY created_at DESC) as rn
    FROM tenants 
    WHERE landlord_id = 'TU_USER_ID_AQUI'
)
DELETE FROM tenants 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 6. Sincronizar property_name con la tabla properties
UPDATE tenants 
SET property_name = p.name
FROM properties p
WHERE tenants.property_id = p.id
AND tenants.landlord_id = 'TU_USER_ID_AQUI'
AND p.user_id = 'TU_USER_ID_AQUI';

-- 7. Verificar el estado final
SELECT 
    t.id,
    t.name,
    t.property_name,
    u.unit_number,
    u.tenant_id,
    p.name as property_from_table
FROM tenants t
LEFT JOIN units u ON u.tenant_id = t.id
LEFT JOIN properties p ON p.id = t.property_id
WHERE t.landlord_id = 'TU_USER_ID_AQUI'
ORDER BY t.name;

-- INSTRUCCIONES:
-- 1. Reemplaza 'TU_USER_ID_AQUI' con tu user_id real
-- 2. Ejecuta los queries uno por uno en orden
-- 3. Verifica los resultados antes de continuar
-- 4. El query #7 debe mostrar datos limpios y consistentes

-- Para obtener tu user_id, ejecuta:
-- SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com';