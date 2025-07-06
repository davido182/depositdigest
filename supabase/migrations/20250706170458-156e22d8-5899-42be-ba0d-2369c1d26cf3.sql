
-- Insertar roles para usuarios existentes que no tienen registro en user_roles
-- Esto asumirá que son landlord_free por defecto
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT 
  u.id,
  'landlord_free'::user_role,
  now(),
  now()
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- Si quieres hacer premium a un usuario específico (reemplaza el email)
-- UPDATE public.user_roles 
-- SET role = 'landlord_premium', updated_at = now()
-- WHERE user_id IN (
--   SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com'
-- );
