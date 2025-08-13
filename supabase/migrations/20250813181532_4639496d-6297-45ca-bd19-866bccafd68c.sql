-- Storage policies for 'lease-contracts' bucket to allow authenticated users to manage their own files

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