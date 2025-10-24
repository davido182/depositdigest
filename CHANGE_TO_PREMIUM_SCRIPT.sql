-- SCRIPT PARA CAMBIAR USUARIO A PREMIUM
-- Ejecutar en Supabase SQL Editor

-- 1. Ver tu usuario actual
SELECT id, email FROM auth.users WHERE email = 'adavidom@proton.me';

-- 2. Ver tu rol actual
SELECT * FROM user_roles WHERE user_id = '18eaaefa-169b-4d7d-978f-7dcde085def3';

-- 3. CAMBIAR A PREMIUM (ejecutar este)
UPDATE user_roles 
SET 
    role = 'landlord_premium',
    trial_end_date = NULL,
    updated_at = NOW()
WHERE user_id = '18eaaefa-169b-4d7d-978f-7dcde085def3';

-- 4. Verificar el cambio
SELECT * FROM user_roles WHERE user_id = '18eaaefa-169b-4d7d-978f-7dcde085def3';

-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Ejecuta el query #3 para cambiar a premium
-- 3. Ejecuta el query #4 para verificar
-- 4. Recarga la aplicación para ver el cambio