-- Fix maintenance_requests to properly link tenant and landlord
-- Update existing maintenance requests to set landlord_id based on tenant relationships

UPDATE maintenance_requests 
SET landlord_id = (
  SELECT landlord_id 
  FROM tenants 
  WHERE tenants.id = maintenance_requests.tenant_id
)
WHERE landlord_id IS NULL;