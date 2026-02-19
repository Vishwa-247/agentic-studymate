-- Create RLS policies for resume-files storage bucket
-- Allow users to view their own uploaded files
CREATE POLICY "Users can view their own resume files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'resume-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to upload their own resume files
CREATE POLICY "Users can upload their own resume files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'resume-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own resume files
CREATE POLICY "Users can update their own resume files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'resume-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own resume files
CREATE POLICY "Users can delete their own resume files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'resume-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);