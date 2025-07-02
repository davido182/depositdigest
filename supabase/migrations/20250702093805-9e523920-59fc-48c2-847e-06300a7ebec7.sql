
-- Update user role to premium
UPDATE public.user_roles 
SET role = 'landlord_premium', updated_at = now()
WHERE user_id = 'cd13fc0b-8622-4227-9955-95a8790087c4';

-- Insert or update subscriber record for premium access
INSERT INTO public.subscribers (user_id, email, subscribed, plan, updated_at)
VALUES (
  'cd13fc0b-8622-4227-9955-95a8790087c4',
  (SELECT email FROM auth.users WHERE id = 'cd13fc0b-8622-4227-9955-95a8790087c4'),
  true,
  'premium',
  now()
)
ON CONFLICT (email) 
DO UPDATE SET 
  subscribed = true,
  plan = 'premium',
  updated_at = now();
