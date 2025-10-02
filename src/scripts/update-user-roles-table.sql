-- Actualizar tabla user_roles para soportar trials
ALTER TABLE user_roles 
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_user_roles_trial_end_date ON user_roles(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_trial ON user_roles(is_trial);

-- Comentarios para documentación
COMMENT ON COLUMN user_roles.trial_end_date IS 'Fecha de finalización del período de prueba premium';
COMMENT ON COLUMN user_roles.is_trial IS 'Indica si el usuario está en período de prueba';