-- ARREGLAR TODAS LAS COLUMNAS FALTANTES EN TABLA TENANTS
-- Ejecutar TODO este script en Supabase SQL Editor

-- 1. Agregar todas las columnas que faltan
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS unit_number TEXT,
ADD COLUMN IF NOT EXISTS lease_end_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS property_name TEXT,
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);

-- 2. Verificar que todas las columnas necesarias existen
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  CASE 
    WHEN column_name IN ('unit_number', 'lease_end_date', 'notes', 'property_name', 'property_id') 
    THEN '✅ REQUIRED' 
    ELSE '📋 EXISTING' 
  END as status
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name IN (
  'id', 'landlord_id', 'name', 'email', 'phone', 'status',
  'lease_start_date', 'lease_end_date', 'rent_amount',
  'unit_number', 'property_name', 'property_id', 'notes',
  'created_at', 'updated_at'
)
ORDER BY 
  CASE 
    WHEN column_name IN ('unit_number', 'lease_end_date', 'notes', 'property_name', 'property_id') 
    THEN 1 
    ELSE 2 
  END,
  column_name;

-- 3. Ver algunos datos de ejemplo después de agregar columnas
SELECT 
  id, 
  name, 
  unit_number, 
  property_name, 
  property_id,
  lease_start_date,
  lease_end_date,
  notes
FROM tenants 
LIMIT 3;