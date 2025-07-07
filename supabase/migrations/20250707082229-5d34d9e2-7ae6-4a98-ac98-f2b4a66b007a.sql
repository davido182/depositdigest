
-- Agregar columna email a user_roles para mejor búsqueda
ALTER TABLE public.user_roles ADD COLUMN email TEXT;

-- Actualizar los emails existentes
UPDATE public.user_roles 
SET email = u.email
FROM auth.users u 
WHERE public.user_roles.user_id = u.id;

-- Habilitar protección de contraseñas filtradas (HIBP)
UPDATE auth.config
SET enable_hibp_check = true
WHERE id = 1;

-- Arreglar función handle_new_user para evitar problemas de search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- También insertar en user_roles por defecto
  INSERT INTO public.user_roles (user_id, role, email, created_at, updated_at)
  VALUES (
    NEW.id,
    'landlord_free'::user_role,
    NEW.email,
    now(),
    now()
  );
  
  RETURN NEW;
END;
$$;

-- Arreglar otras funciones con search_path
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscribers 
    WHERE user_id = _user_id AND subscribed = true AND plan = 'premium'
  );
$$;
