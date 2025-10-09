-- Final fix for units table - remove user_id column if it exists and ensure correct structure

-- Remove user_id column if it exists (this column should not exist in units table)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'user_id') THEN
        ALTER TABLE units DROP COLUMN user_id;
    END IF;
END $$;

-- Ensure all required columns exist with correct types
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS unit_number VARCHAR(50) NOT NULL,
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS square_meters DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_furnished BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT[],
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Remove rent_amount column if it exists (we use monthly_rent instead)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'rent_amount') THEN
        -- Copy data from rent_amount to monthly_rent if monthly_rent is 0
        UPDATE units SET monthly_rent = rent_amount WHERE monthly_rent = 0 OR monthly_rent IS NULL;
        -- Drop the old column
        ALTER TABLE units DROP COLUMN rent_amount;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant_id ON units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_units_is_available ON units(is_available);

-- Update RLS policies for units table
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own units" ON units;
DROP POLICY IF EXISTS "Users can insert their own units" ON units;
DROP POLICY IF EXISTS "Users can update their own units" ON units;
DROP POLICY IF EXISTS "Users can delete their own units" ON units;

-- Create correct policies based on property ownership
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