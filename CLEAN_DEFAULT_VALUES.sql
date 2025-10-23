-- Script para limpiar valores por defecto incorrectos
-- EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Ver inquilinos con valores por defecto incorrectos
SELECT 
    id,
    name,
    property_name,
    landlord_id
FROM tenants 
WHERE property_name IN ('Sin propiedad', 'Edificio Principal')
AND landlord_id = 'TU_USER_ID_AQUI';  -- REEMPLAZA CON TU USER_ID

-- 2. Limpiar property_name con valores por defecto
UPDATE tenants 
SET property_name = NULL
WHERE property_name IN ('Sin propiedad', 'Edificio Principal')
AND landlord_id = 'TU_USER_ID_AQUI';  -- REEMPLAZA CON TU USER_ID

-- 3. Verificar el resultado
SELECT 
    id,
    name,
    property_name,
    landlord_id
FROM tenants 
WHERE landlord_id = 'TU_USER_ID_AQUI'  -- REEMPLAZA CON TU USER_ID
ORDER BY name;

-- 4. Para obtener tu user_id, ejecuta:
-- SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com';

-- INSTRUCCIONES:
-- 1. Reemplaza 'TU_USER_ID_AQUI' con tu user_id real
-- 2. Ejecuta los queries en orden
-- 3. Después recarga la aplicación para ver los cambios