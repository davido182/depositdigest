-- Create storage policies for private uploads in the existing 'lease-contracts' bucket
-- Allow authenticated users to manage ONLY their own files based on owner column

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own files in lease-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to lease-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in lease-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in lease-contracts" ON storage.objects;

-- READ policy
CREATE POLICY "Users can read own files in lease-contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'lease-contracts' AND owner = auth.uid());

-- INSERT policy
CREATE POLICY "Users can upload to lease-contracts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lease-contracts' AND owner = auth.uid());

-- UPDATE policy
CREATE POLICY "Users can update own files in lease-contracts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'lease-contracts' AND owner = auth.uid());

-- DELETE policy
CREATE POLICY "Users can delete own files in lease-contracts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lease-contracts' AND owner = auth.uid());