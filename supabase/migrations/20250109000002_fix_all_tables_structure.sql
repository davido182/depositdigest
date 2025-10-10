-- Fix all table structures to match the application code exactly
-- This migration will ensure all tables have the correct column names

-- First, let's ensure the tenants table has the correct structure
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  moveInDate DATE,
  leaseEndDate DATE,
  rent_amount DECIMAL(10,2) DEFAULT 0,
  depositAmount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'late', 'notice')),
  notes TEXT,
  property_id UUID, -- For unit assignment
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure properties table exists with correct structure
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  total_units INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure units table exists with correct structure (without user_id)
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  square_meters DECIMAL(8,2),
  monthly_rent DECIMAL(10,2) DEFAULT 0,
  deposit_amount DECIMAL(10,2),
  is_furnished BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  description TEXT,
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure payments table exists with correct structure
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type TEXT DEFAULT 'rent' CHECK (payment_type IN ('rent', 'deposit', 'fee', 'other')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'transfer', 'card', 'other')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes TEXT,
  receipt_file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure maintenance_requests table exists with correct structure
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  unit_number TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('emergency', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add missing columns to existing tables if they don't exist
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS moveInDate DATE,
ADD COLUMN IF NOT EXISTS leaseEndDate DATE,
ADD COLUMN IF NOT EXISTS rent_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS depositAmount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Remove columns that shouldn't exist
ALTER TABLE public.units DROP COLUMN IF EXISTS user_id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_landlord_id ON public.tenants(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON public.properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant_id ON public.units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_landlord_id ON public.payments(landlord_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_landlord_id ON public.maintenance_requests(landlord_id);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Landlords can view their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Landlords can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Landlords can update their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Landlords can delete their tenants" ON public.tenants;

DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can create their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

DROP POLICY IF EXISTS "Users can view their own units" ON public.units;
DROP POLICY IF EXISTS "Users can insert their own units" ON public.units;
DROP POLICY IF EXISTS "Users can update their own units" ON public.units;
DROP POLICY IF EXISTS "Users can delete their own units" ON public.units;

-- Create correct RLS policies
-- Tenants policies
CREATE POLICY "Landlords can view their tenants" ON public.tenants
  FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can insert tenants" ON public.tenants
  FOR INSERT WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update their tenants" ON public.tenants
  FOR UPDATE USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can delete their tenants" ON public.tenants
  FOR DELETE USING (landlord_id = auth.uid());

-- Properties policies
CREATE POLICY "Landlords can view their properties" ON public.properties
  FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can insert properties" ON public.properties
  FOR INSERT WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update their properties" ON public.properties
  FOR UPDATE USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can delete their properties" ON public.properties
  FOR DELETE USING (landlord_id = auth.uid());

-- Units policies (based on property ownership)
CREATE POLICY "Landlords can view their units" ON public.units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = units.property_id 
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can insert units" ON public.units
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = units.property_id 
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can update their units" ON public.units
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = units.property_id 
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can delete their units" ON public.units
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = units.property_id 
      AND properties.landlord_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Landlords can view their payments" ON public.payments
  FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can insert payments" ON public.payments
  FOR INSERT WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update their payments" ON public.payments
  FOR UPDATE USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can delete their payments" ON public.payments
  FOR DELETE USING (landlord_id = auth.uid());

-- Drop existing maintenance policies first
DROP POLICY IF EXISTS "Landlords can view their maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Landlords can insert maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Landlords can update their maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Landlords can delete their maintenance requests" ON public.maintenance_requests;

-- Maintenance requests policies
CREATE POLICY "Landlords can view their maintenance requests" ON public.maintenance_requests
  FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can insert maintenance requests" ON public.maintenance_requests
  FOR INSERT WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update their maintenance requests" ON public.maintenance_requests
  FOR UPDATE USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can delete their maintenance requests" ON public.maintenance_requests
  FOR DELETE USING (landlord_id = auth.uid());

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_units_updated_at ON public.units;
CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_requests_updated_at ON public.maintenance_requests;
CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();