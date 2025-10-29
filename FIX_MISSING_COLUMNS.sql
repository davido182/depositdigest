-- Arreglar columnas faltantes en la tabla tenants
-- Ejecutar en Supabase SQL Editor

-- Agregar columna unit_number si no existe
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS unit_number TEXT;

-- Verificar que property_name existe (debería existir)
-- Si no existe, agregarla
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS property_name TEXT;

-- Verificar las columnas existentes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name IN ('unit_number', 'property_name', 'property_id')
ORDER BY column_name;

-- Ver datos actuales
SELECT id, name, unit_number, property_name, property_id 
FROM tenants 
LIMIT 5;