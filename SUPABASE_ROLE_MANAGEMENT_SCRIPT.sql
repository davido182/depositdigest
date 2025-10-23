-- Script SQL para gestión de roles en Supabase
-- Ejecuta estos comandos en el SQL Editor de Supabase

-- 1. Ver todos los roles actuales
SELECT 
    ur.user_id,
    au.email,
    ur.role,
    ur.trial_end_date,
    ur.created_at,
    ur.updated_at
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
ORDER BY ur.created_at DESC;

-- 2. Cambiar un usuario específico a Premium (reemplaza 'tu-email@ejemplo.com' con tu email)
UPDATE user_roles 
SET 
    role = 'landlord_premium',
    trial_end_date = NULL,
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com'
);

-- 3. Cambiar un usuario específico a Free (reemplaza 'tu-email@ejemplo.com' con tu email)
UPDATE user_roles 
SET 
    role = 'landlord_free',
    trial_end_date = NULL,
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com'
);

-- 4. Crear rol para un usuario que no lo tenga (reemplaza 'tu-email@ejemplo.com' con tu email)
INSERT INTO user_roles (user_id, role, trial_end_date)
SELECT 
    au.id,
    'landlord_premium',
    NULL
FROM auth.users au
WHERE au.email = 'tu-email@ejemplo.com'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = au.id
);

-- 5. Ver estructura de la tabla user_roles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- 6. Verificar cambios después de ejecutar
SELECT 
    ur.user_id,
    au.email,
    ur.role,
    ur.trial_end_date,
    ur.created_at,
    ur.updated_at
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'tu-email@ejemplo.com';

-- INSTRUCCIONES:
-- 1. Abre Supabase Dashboard > SQL Editor
-- 2. Reemplaza 'tu-email@ejemplo.com' con tu email real
-- 3. Ejecuta primero el comando #1 para ver el estado actual
-- 4. Ejecuta el comando #2 para cambiar a Premium o #3 para cambiar a Free
-- 5. Ejecuta el comando #6 para verificar el cambio
-- 6. Recarga tu aplicación para ver los cambios reflejados

-- NOTA: Los cambios son inmediatos y persistentes en la base de datos