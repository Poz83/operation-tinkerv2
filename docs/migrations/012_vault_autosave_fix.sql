-- =============================================================================
-- VAULT & AUTOSAVE FIX - Migration 012
-- =============================================================================
-- Purpose: Fix all schema issues causing vault/autosave failures
-- 
-- Issues Fixed:
-- 1. images.type constraint only allowed ('upload', 'generated', 'edited')
--    but code uses 'page', 'hero_base', 'reference', 'profile_sheet'
-- 2. hero_lab_data missing reference_image_url and profile_sheet_url columns
-- 3. RLS policies using expensive subqueries causing timeouts
-- 
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: FIX IMAGES TABLE TYPE CONSTRAINT
-- =============================================================================

-- Drop old constraint and add new one with all valid types
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_type_check;

ALTER TABLE public.images ADD CONSTRAINT images_type_check 
    CHECK (type IN (
        'upload',        -- User-uploaded file
        'generated',     -- AI-generated (legacy)
        'edited',        -- Edited version of another image
        'page',          -- Coloring book page
        'hero_base',     -- Hero Lab base image
        'reference',     -- Reference image for Hero Lab
        'profile_sheet'  -- Multi-angle hero profile sheet
    ));

-- =============================================================================
-- PART 2: ADD MISSING HERO_LAB_DATA COLUMNS
-- =============================================================================

-- Add columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hero_lab_data' 
        AND column_name = 'reference_image_url'
    ) THEN
        ALTER TABLE public.hero_lab_data ADD COLUMN reference_image_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hero_lab_data' 
        AND column_name = 'profile_sheet_url'
    ) THEN
        ALTER TABLE public.hero_lab_data ADD COLUMN profile_sheet_url TEXT;
    END IF;
END $$;

-- =============================================================================
-- PART 3: SIMPLIFY RLS POLICIES
-- =============================================================================
-- Replace expensive subquery-based policies with simpler direct checks

-- ---- IMAGES TABLE ----
-- Images already have user_id, so we can check directly (no subquery!)

DROP POLICY IF EXISTS "coloring_studio_data_all" ON public.coloring_studio_data;
DROP POLICY IF EXISTS "hero_lab_data_all" ON public.hero_lab_data;
DROP POLICY IF EXISTS "images_select_own" ON public.images;
DROP POLICY IF EXISTS "images_select_public_projects" ON public.images;
DROP POLICY IF EXISTS "Users can manage coloring_studio_data" ON public.coloring_studio_data;
DROP POLICY IF EXISTS "Users can manage hero_lab_data" ON public.hero_lab_data;
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Users can create own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;
DROP POLICY IF EXISTS "images_user_owns" ON public.images;
DROP POLICY IF EXISTS "coloring_data_via_project" ON public.coloring_studio_data;
DROP POLICY IF EXISTS "hero_data_via_project" ON public.hero_lab_data;

-- Images: Direct user_id check (no subquery, fast!)
CREATE POLICY "images_user_owns" ON public.images
    FOR ALL USING (user_id = auth.uid());

-- Coloring Studio Data: Use EXISTS for single-row check (more efficient than IN)
CREATE POLICY "coloring_data_via_project" ON public.coloring_studio_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

-- Hero Lab Data: Use EXISTS for single-row check
CREATE POLICY "hero_data_via_project" ON public.hero_lab_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

-- =============================================================================
-- PART 4: ADD PERFORMANCE INDEX
-- =============================================================================

-- Composite index for fast user project listing (sorted by updated_at)
CREATE INDEX IF NOT EXISTS idx_projects_user_updated 
    ON public.projects(user_id, updated_at DESC)
    WHERE is_archived = false;

-- =============================================================================
-- PART 5: UPDATE STATISTICS
-- =============================================================================

ANALYZE public.projects;
ANALYZE public.images;
ANALYZE public.coloring_studio_data;
ANALYZE public.hero_lab_data;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (Run after migration to confirm)
-- =============================================================================
-- Uncomment and run these to verify the migration worked:

-- Check images constraint includes all types:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'public.images'::regclass AND contype = 'c';

-- Check hero_lab_data has new columns:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'hero_lab_data' AND table_schema = 'public';

-- Check RLS policies are set:
-- SELECT policyname, tablename, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('images', 'coloring_studio_data', 'hero_lab_data');
