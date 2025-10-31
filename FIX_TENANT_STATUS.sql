-- Script para corregir el status de inquilinos
-- Actualizar todos los inquilinos que no tienen status o tienen status NULL a 'active'

UPDATE tenants 
SET status = 'active' 
WHERE status IS NULL OR status = '' OR status NOT IN ('active', 'inactive', 'late', 'notice');

-- Verificar los resultados
SELECT 
  id,
  first_name,
  name,
  status,
  unit_number,
  property_name
FROM tenants 
ORDER BY created_at DESC;

-- Contar inquilinos por status
SELECT 
  status,
  COUNT(*) as count
FROM tenants 
GROUP BY status;