-- Create maintenance_providers table
CREATE TABLE IF NOT EXISTS maintenance_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  description TEXT,
  rating DECIMAL(2,1) DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_assignments table for tracking provider assignments
CREATE TABLE IF NOT EXISTS maintenance_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES maintenance_providers(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_providers_landlord_id ON maintenance_providers(landlord_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_providers_specialties ON maintenance_providers USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_maintenance_assignments_request_id ON maintenance_assignments(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assignments_provider_id ON maintenance_assignments(provider_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assignments_status ON maintenance_assignments(status);

-- Add RLS policies
ALTER TABLE maintenance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_assignments ENABLE ROW LEVEL SECURITY;

-- Providers policies
CREATE POLICY "Landlords can view their own providers" ON maintenance_providers
  FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can insert their own providers" ON maintenance_providers
  FOR INSERT WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update their own providers" ON maintenance_providers
  FOR UPDATE USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can delete their own providers" ON maintenance_providers
  FOR DELETE USING (landlord_id = auth.uid());

-- Assignments policies
CREATE POLICY "Users can view assignments for their requests" ON maintenance_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM maintenance_requests mr 
      WHERE mr.id = maintenance_request_id 
      AND mr.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can create assignments" ON maintenance_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_requests mr 
      WHERE mr.id = maintenance_request_id 
      AND mr.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can update assignments" ON maintenance_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM maintenance_requests mr 
      WHERE mr.id = maintenance_request_id 
      AND mr.landlord_id = auth.uid()
    )
  );

-- Add assignment_notes and scheduled_date columns to maintenance_requests if they don't exist
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS assignment_notes TEXT,
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;

-- Update trigger for maintenance_providers
CREATE OR REPLACE FUNCTION update_maintenance_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_providers_updated_at
  BEFORE UPDATE ON maintenance_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_providers_updated_at();

-- Update trigger for maintenance_assignments
CREATE OR REPLACE FUNCTION update_maintenance_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_assignments_updated_at
  BEFORE UPDATE ON maintenance_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_assignments_updated_at();