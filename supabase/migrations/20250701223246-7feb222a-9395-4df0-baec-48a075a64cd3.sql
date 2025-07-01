
-- Create app_plan enum for different subscription tiers
CREATE TYPE public.app_plan AS ENUM ('free', 'premium');

-- Create user_role enum for different user types
CREATE TYPE public.user_role AS ENUM ('landlord_free', 'landlord_premium', 'tenant');

-- Create subscribers table for subscription management
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  plan app_plan NOT NULL DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'landlord_free',
  landlord_id UUID REFERENCES auth.users(id), -- For tenants, reference to their landlord
  unit_code TEXT, -- For tenant invitations
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create tenant_invitations table for landlord-tenant connections
CREATE TABLE public.tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unit_number TEXT NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL,
  email TEXT,
  used_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscribers
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Edge functions can manage subscriptions" ON public.subscribers
FOR ALL USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Landlords can view their tenants" ON public.user_roles
FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Edge functions can manage roles" ON public.user_roles
FOR ALL USING (true);

-- RLS Policies for tenant_invitations
CREATE POLICY "Landlords can manage their invitations" ON public.tenant_invitations
FOR ALL USING (landlord_id = auth.uid());

CREATE POLICY "Anyone can view invitations by code" ON public.tenant_invitations
FOR SELECT USING (true);

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- Security definer function to check if user has premium
CREATE OR REPLACE FUNCTION public.has_premium(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscribers 
    WHERE user_id = _user_id AND subscribed = true AND plan = 'premium'
  );
$$;

-- Update existing tables to support multi-tenancy
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES auth.users(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES auth.users(id);
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES auth.users(id);

-- Update RLS policies for existing tables to support landlord-tenant relationship
DROP POLICY IF EXISTS "Users can view their own tenants" ON public.tenants;
CREATE POLICY "Landlords can view their tenants" ON public.tenants
FOR SELECT USING (landlord_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Tenants can view their own info" ON public.tenants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'tenant' AND landlord_id = public.tenants.landlord_id
  )
);

-- Function to generate invitation codes
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT upper(substring(encode(gen_random_bytes(6), 'base64'), 1, 8));
$$;
