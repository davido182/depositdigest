-- Ensure maintenance_requests table exists with correct structure
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('emergency', 'high', 'medium', 'low')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  unit_number VARCHAR(50),
  assigned_to VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_landlord_id ON maintenance_requests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON maintenance_requests(priority);

-- Enable RLS
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Landlords can view tenant maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can insert their own maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can update their own maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Landlords can update tenant maintenance requests" ON maintenance_requests;

-- Create RLS policies
CREATE POLICY "Users can view their own maintenance requests" ON maintenance_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Landlords can view tenant maintenance requests" ON maintenance_requests
  FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Users can insert their own maintenance requests" ON maintenance_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own maintenance requests" ON maintenance_requests
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Landlords can update tenant maintenance requests" ON maintenance_requests
  FOR UPDATE USING (landlord_id = auth.uid());

-- Update trigger
CREATE OR REPLACE FUNCTION update_maintenance_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_maintenance_requests_updated_at ON maintenance_requests;
CREATE TRIGGER trigger_update_maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_requests_updated_at();