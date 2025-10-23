-- SCRIPT GLOBAL - LIMPIEZA DE DATOS CORRUPTOS PARA TODOS LOS USUARIOS
-- EJECUTAR EN SUPABASE SQL EDITOR

-- PASO 1: Ver cuántos registros tienen datos corruptos (TODOS LOS USUARIOS)
SELECT 
    COUNT(*) as total_corrupted_records,
    property_name
FROM tenants 
WHERE property_name IN ('Sin propiedad', 'Edificio Principal', 'Sin asignar')
GROUP BY property_name
ORDER BY total_corrupted_records DESC;

-- PASO 2: Ver usuarios afectados
SELECT 
    landlord_id,
    COUNT(*) as corrupted_tenants
FROM tenants 
WHERE property_name IN ('Sin propiedad', 'Edificio Principal', 'Sin asignar')
GROUP BY landlord_id
ORDER BY corrupted_tenants DESC;

-- PASO 3: LIMPIAR TODOS LOS VALORES HARDCODEADOS INCORRECTOS (GLOBAL)
UPDATE tenants 
SET property_name = NULL
WHERE property_name IN ('Sin propiedad', 'Edificio Principal', 'Sin asignar');

-- PASO 4: Verificar que la limpieza fue exitosa
SELECT 
    COUNT(*) as remaining_corrupted_records
FROM tenants 
WHERE property_name IN ('Sin propiedad', 'Edificio Principal', 'Sin asignar');

-- PASO 5: Actualizar property_name con datos reales donde sea posible
UPDATE tenants 
SET property_name = p.name
FROM properties p
WHERE tenants.property_id = p.id
AND tenants.property_name IS NULL
AND p.user_id = tenants.landlord_id;

-- PASO 6: Verificar el resultado final
SELECT 
    COUNT(CASE WHEN property_name IS NULL THEN 1 END) as null_property_names,
    COUNT(CASE WHEN property_name IS NOT NULL THEN 1 END) as valid_property_names,
    COUNT(*) as total_tenants
FROM tenants;

-- PASO 7: Ver una muestra de los datos limpiados
SELECT 
    t.name as tenant_name,
    t.property_name,
    p.name as actual_property_name,
    CASE 
        WHEN t.property_name IS NULL AND t.property_id IS NULL THEN 'Sin asignar'
        WHEN t.property_name IS NULL AND t.property_id IS NOT NULL THEN 'Necesita sincronización'
        ELSE 'OK'
    END as status
FROM tenants t
LEFT JOIN properties p ON p.id = t.property_id
LIMIT 20;

-- INSTRUCCIONES:
-- 1. Ejecuta los queries en orden
-- 2. PASO 1-2: Ver el alcance del problema
-- 3. PASO 3: Limpiar TODOS los datos corruptos
-- 4. PASO 4: Verificar limpieza
-- 5. PASO 5: Restaurar datos reales donde sea posible
-- 6. PASO 6-7: Verificar resultado final
-- 7. La aplicación ahora manejará automáticamente la limpieza para nuevos casos