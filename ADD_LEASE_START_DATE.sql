-- Agregar la columna lease_start_date que falta
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS lease_start_date DATE;

-- Verificar que ahora existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name = 'lease_start_date';