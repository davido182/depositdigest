-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for user Stripe configurations
CREATE TABLE public.user_stripe_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  publishable_key TEXT,
  secret_key TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_stripe_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for user Stripe configurations
CREATE POLICY "Users can view their own stripe config" 
ON public.user_stripe_configs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stripe config" 
ON public.user_stripe_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stripe config" 
ON public.user_stripe_configs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stripe config" 
ON public.user_stripe_configs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_stripe_configs_updated_at
BEFORE UPDATE ON public.user_stripe_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();