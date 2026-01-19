-- =============================================================================
-- FIX PERSISTENCE & PERFORMANCE - Migration 019
-- =============================================================================
-- Purpose: Fix 500 Timeouts, Enable Deletion, and Optimize Performance
-- 
-- 1. INDEXES: Fix the timeouts by indexing frequently filtered/sorted columns.
-- 2. RLS: Consolidate policies to ensure Owners have full permissions (including DELETE).
--
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

BEGIN;

-- 1. PERFORMANCE INDEXES
-- Support: .eq('user_id', ...) .order('updated_at')
CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON public.projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_public_id ON public.projects(public_id);
CREATE INDEX IF NOT EXISTS idx_images_project_id ON public.images(project_id);

-- 2. PROJECTS RLS (Fix "Cannot delete" and "Timeout" from complex policies)
DROP POLICY IF EXISTS "projects_owner_all" ON public.projects;
DROP POLICY IF EXISTS "projects_public_select" ON public.projects;
DROP POLICY IF EXISTS "projects_read_access" ON public.projects;
DROP POLICY IF EXISTS "projects_write_own" ON public.projects;

-- Allow Owners to do EVERYTHING (Select, Insert, Update, Delete)
CREATE POLICY "projects_owner_all" ON public.projects
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow Public to View Public Projects
CREATE POLICY "projects_public_view" ON public.projects
    FOR SELECT
    USING (visibility = 'public');

-- 3. IMAGES RLS
DROP POLICY IF EXISTS "images_owner_all" ON public.images;
DROP POLICY IF EXISTS "images_project_access" ON public.images;

-- Simple Owner Policy for Images
CREATE POLICY "images_owner_all" ON public.images
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. AUX TABLES RLS (Coloring/Hero Data)
-- Ensure cascading deletes work by allowing owners to manage these
DROP POLICY IF EXISTS "coloring_data_owner" ON public.coloring_studio_data;
CREATE POLICY "coloring_data_owner" ON public.coloring_studio_data
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM projects WHERE id = coloring_studio_data.project_id AND user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM projects WHERE id = coloring_studio_data.project_id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "hero_data_owner" ON public.hero_lab_data;
CREATE POLICY "hero_data_owner" ON public.hero_lab_data
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM projects WHERE id = hero_lab_data.project_id AND user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM projects WHERE id = hero_lab_data.project_id AND user_id = auth.uid())
    );

COMMIT;
