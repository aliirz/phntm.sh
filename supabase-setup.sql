-- ============================================
-- PHNTM - Supabase Setup
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create files table
CREATE TABLE IF NOT EXISTS public.files (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  downloads INT DEFAULT 0
);

-- 2. Enable RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Anyone can read file metadata (needed for download page)
CREATE POLICY "Anyone can read files" ON public.files
  FOR SELECT USING (true);

-- Anyone can insert files (anonymous uploads)
CREATE POLICY "Anyone can insert files" ON public.files
  FOR INSERT WITH CHECK (true);

-- Service role can delete expired files (used by cron cleanup)
CREATE POLICY "Service role can delete files" ON public.files
  FOR DELETE USING (true);

-- 4. Create storage bucket (public — files are encrypted anyway)
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS policies
CREATE POLICY "Anyone can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'files');

CREATE POLICY "Anyone can download files" ON storage.objects
  FOR SELECT USING (bucket_id = 'files');

CREATE POLICY "Service role can delete files" ON storage.objects
  FOR DELETE USING (bucket_id = 'files');

-- 6. Analytics events table (anonymous, server-side only)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_created
  ON analytics_events (event, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service role can read/write

-- 7. Cleanup function for expired files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void AS $$
DECLARE
  expired_file RECORD;
BEGIN
  -- Delete storage objects for expired files
  FOR expired_file IN
    SELECT id FROM public.files WHERE expires_at < now()
  LOOP
    DELETE FROM storage.objects
    WHERE bucket_id = 'files' AND name = expired_file.id;
  END LOOP;

  -- Delete expired file metadata
  DELETE FROM public.files WHERE expires_at < now();

  -- Purge analytics events older than 90 days
  DELETE FROM public.analytics_events WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Schedule cleanup every hour (requires pg_cron extension)
-- Enable pg_cron first in Supabase Dashboard > Database > Extensions
SELECT cron.schedule(
  'cleanup-expired-files',
  '0 * * * *',
  'SELECT cleanup_expired_files()'
);
