-- Limpiar roles duplicados para el usuario adochoam@outlook.com
-- Mantener solo el rol landlord_premium
DELETE FROM user_roles 
WHERE user_id = 'cd13fc0b-8622-4227-9955-95a8790087c4' 
AND role != 'landlord_premium';

-- Si no hay rol premium, crear uno
INSERT INTO user_roles (user_id, role)
SELECT 'cd13fc0b-8622-4227-9955-95a8790087c4', 'landlord_premium'
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = 'cd13fc0b-8622-4227-9955-95a8790087c4' 
  AND role = 'landlord_premium'
);