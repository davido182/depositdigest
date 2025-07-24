-- Update maintenance_requests table to include landlord_id for proper visibility
UPDATE maintenance_requests 
SET landlord_id = (
  SELECT landlord_id 
  FROM tenants 
  WHERE tenants.id = maintenance_requests.tenant_id
) 
WHERE landlord_id IS NULL;