-- ============================================================================
-- Migration 024: Waitlist Table
-- ============================================================================
-- Creates the waitlist table for collecting sign-ups with RLS for public INSERT only.
-- ============================================================================

-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  privacy_consent BOOLEAN NOT NULL DEFAULT false,
  contact_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.waitlist IS 'Waitlist sign-ups for early access';

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- RLS: Allow public INSERT only (no auth required)
-- Anonymous users can add themselves to the waitlist
CREATE POLICY "waitlist_public_insert" 
ON public.waitlist 
FOR INSERT 
TO anon
WITH CHECK (
  -- Require privacy consent to be true
  privacy_consent = true
);

-- No SELECT/UPDATE/DELETE policies = data is write-only for anon users
-- Only authenticated admins with service_role can read/modify data

-- Create index on email for faster duplicate checks
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at DESC);
