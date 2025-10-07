-- Fix units table structure and add missing columns
-- This migration ensures the units table has the correct structure

-- First, let's check if the table exists and add missing columns
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS square_meters DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_furnished BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Rename rent_amount to monthly_rent if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'rent_amount') THEN
        ALTER TABLE units RENAME COLUMN rent_amount TO monthly_rent;
    END IF;
END $$;

-- Add monthly_rent column if it doesn't exist
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(10,2) DEFAULT 0;

-- Create index for tenant_id
CREATE INDEX IF NOT EXISTS idx_units_tenant_id ON units(tenant_id);

-- Update RLS policies for units table
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own units" ON units;
DROP POLICY IF EXISTS "Users can insert their own units" ON units;
DROP POLICY IF EXISTS "Users can update their own units" ON units;
DROP POLICY IF EXISTS "Users can delete their own units" ON units;

-- Create new policies
CREATE POLICY "Users can view their own units" ON units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = units.property_id 
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own units" ON units
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = units.property_id 
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own units" ON units
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = units.property_id 
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own units" ON units
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = units.property_id 
      AND properties.landlord_id = auth.uid()
    )
  );

-- Update trigger for units
CREATE OR REPLACE FUNCTION update_units_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_units_updated_at ON units;
CREATE TRIGGER trigger_update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_units_updated_at();