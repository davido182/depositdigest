-- Run the previously approved migration for maintenance requests and tenants
-- Add landlord_id to maintenance_requests and property_name to tenants
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS landlord_id uuid;

-- Update existing maintenance requests to set landlord_id from tenant's landlord_id
UPDATE public.maintenance_requests 
SET landlord_id = (
  SELECT t.landlord_id 
  FROM public.tenants t 
  WHERE t.id = maintenance_requests.tenant_id
)
WHERE landlord_id IS NULL;

-- Ensure property_name column exists in tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS property_name text DEFAULT 'Edificio Principal';

-- Create properties table for better property management
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  total_units integer NOT NULL DEFAULT 1,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for properties table
CREATE POLICY "Users can view their own properties" 
ON public.properties 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" 
ON public.properties 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" 
ON public.properties 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on properties
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add property_id column to tenants table to properly link with properties
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id);

-- Create payments table enhancements for better tracking
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  has_receipt boolean NOT NULL DEFAULT false,
  receipt_file_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id, year, month)
);

-- Enable RLS on payment_receipts table
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_receipts table
CREATE POLICY "Users can view their own payment receipts" 
ON public.payment_receipts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment receipts" 
ON public.payment_receipts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment receipts" 
ON public.payment_receipts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment receipts" 
ON public.payment_receipts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on payment_receipts
CREATE TRIGGER update_payment_receipts_updated_at
BEFORE UPDATE ON public.payment_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();