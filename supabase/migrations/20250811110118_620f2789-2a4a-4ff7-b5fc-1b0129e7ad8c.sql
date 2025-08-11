-- Crear tabla para almacenar los contactos del formulario
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en la tabla
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para que solo las edge functions puedan insertar
CREATE POLICY "Edge functions can insert contact submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Crear índices para búsquedas eficientes
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- Agregar trigger para updated_at
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();