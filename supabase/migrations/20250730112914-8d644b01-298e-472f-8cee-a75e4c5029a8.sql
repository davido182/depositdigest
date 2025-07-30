-- Update maintenance_requests to properly link tenant and landlord
UPDATE maintenance_requests 
SET landlord_id = (
  SELECT landlord_id 
  FROM tenants 
  WHERE tenants.id = maintenance_requests.tenant_id
)
WHERE landlord_id IS NULL AND tenant_id IS NOT NULL;