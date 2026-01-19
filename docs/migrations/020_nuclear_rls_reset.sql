-- =============================================================================
-- NUCLEAR RLS RESET - Migration 020
-- =============================================================================
-- Purpose: FIX 500 ERRORS ONCE AND FOR ALL by Wiping ALL Policies on Projects
-- 
-- The "Statement Timeout" suggests Supabase is trying to evaluate too many checks.
-- This script gets rid of EVERYTHING and adds back just ONE simple rule.
-- =============================================================================

BEGIN;

-- 1. Wipe Policies on PROJECTS (The source of the 500)
DROP POLICY IF EXISTS "projects_owner_all" ON public.projects;
DROP POLICY IF EXISTS "projects_public_select" ON public.projects;
DROP POLICY IF EXISTS "projects_read_access" ON public.projects;
DROP POLICY IF EXISTS "projects_write_own" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.projects;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.projects;

-- 2. Add ONE Simple "Owner is God" Policy
CREATE POLICY "projects_owner_all_v2" ON public.projects
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Add ONE "Public Read" Policy
CREATE POLICY "projects_public_view_v2" ON public.projects
    FOR SELECT
    USING (visibility = 'public');

-- 4. Ensure RLS is Enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 5. Wipe Policies on IMAGES (Just to be safe)
DROP POLICY IF EXISTS "images_owner_all" ON public.images;
DROP POLICY IF EXISTS "images_select_own" ON public.images;
DROP POLICY IF EXISTS "images_insert_own" ON public.images;

CREATE POLICY "images_owner_all_v2" ON public.images
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

COMMIT;
