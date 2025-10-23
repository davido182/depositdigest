-- SCRIPT DE EMERGENCIA - LIMPIEZA COMPLETA DE DATOS CORRUPTOS
-- EJECUTAR EN SUPABASE SQL EDITOR

-- PASO 1: Obtener tu user_id (EJECUTAR PRIMERO)
SELECT id as user_id, email FROM auth.users WHERE email = 'adavidom@proton.me';

-- PASO 2: Ver el estado actual de tus inquilinos (REEMPLAZA USER_ID)
SELECT 
    id,
    name,
    property_id,
    property_name,
    landlord_id
FROM tenants 
WHERE landlord_id = '18eaaefa-169b-4d7d-978f-7dcde085def3'
ORDER BY name;

-- PASO 3: LIMPIAR TODOS LOS VALORES HARDCODEADOS INCORRECTOS
UPDATE tenants 
SET 
    property_name = NULL,
    property_id = NULL
WHERE landlord_id = '18eaaefa-169b-4d7d-978f-7dcde085def3'
AND property_name IN ('Edificio Principal', 'Sin propiedad');

-- PASO 4: Desasignar todas las unidades de inquilinos para empezar limpio
UPDATE units 
SET 
    tenant_id = NULL,
    is_available = true
WHERE property_id IN (
    SELECT id FROM properties WHERE user_id = '18eaaefa-169b-4d7d-978f-7dcde085def3'
);

-- PASO 5: Verificar que todo esté limpio
SELECT 
    t.id,
    t.name,
    t.property_id,
    t.property_name,
    u.unit_number,
    u.tenant_id
FROM tenants t
LEFT JOIN units u ON u.tenant_id = t.id
WHERE t.landlord_id = '18eaaefa-169b-4d7d-978f-7dcde085def3'
ORDER BY t.name;

-- PASO 6: Ver tus propiedades reales
SELECT 
    id,
    name,
    address
FROM properties 
WHERE user_id = '18eaaefa-169b-4d7d-978f-7dcde085def3'
ORDER BY name;

-- PASO 7: Ver todas las unidades disponibles
SELECT 
    u.id,
    u.unit_number,
    u.is_available,
    u.tenant_id,
    p.name as property_name
FROM units u
JOIN properties p ON p.id = u.property_id
WHERE p.user_id = '18eaaefa-169b-4d7d-978f-7dcde085def3'
ORDER BY p.name, u.unit_number;

-- INSTRUCCIONES:
-- 1. Ejecuta PASO 1 para obtener tu user_id
-- 2. Reemplaza '18eaaefa-169b-4d7d-978f-7dcde085def3' con tu user_id real en todos los queries
-- 3. Ejecuta PASO 2 para ver el estado actual
-- 4. Ejecuta PASO 3 para limpiar datos corruptos
-- 5. Ejecuta PASO 4 para desasignar unidades
-- 6. Ejecuta PASO 5 para verificar limpieza
-- 7. Ejecuta PASO 6 y 7 para ver tus datos reales
-- 8. Recarga la aplicación
-- 9. Reasigna inquilinos a propiedades/unidades desde el formulario