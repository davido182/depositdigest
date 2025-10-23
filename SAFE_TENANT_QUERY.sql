-- Consulta SEGURA para ver solo TUS inquilinos
-- Reemplaza 'tu-email@ejemplo.com' con tu email real

SELECT 
    t.name,
    t.property_name,
    u.unit_number,
    u.tenant_id,
    p.name as property_from_table
FROM tenants t
LEFT JOIN units u ON u.tenant_id = t.id
LEFT JOIN properties p ON p.id = t.property_id
WHERE t.landlord_id = (
    SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com'
)
ORDER BY t.name;

-- Ver unidades asignadas (solo tuyas)
SELECT 
    u.unit_number,
    u.tenant_id,
    u.is_available,
    p.name as property_name,
    t.name as tenant_name
FROM units u
LEFT JOIN properties p ON p.id = u.property_id
LEFT JOIN tenants t ON t.id = u.tenant_id
WHERE p.user_id = (
    SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com'
)
ORDER BY p.name, u.unit_number;