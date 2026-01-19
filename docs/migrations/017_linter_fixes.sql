-- =============================================================================
-- LINTER FIXES & CLEANUP - Migration 017
-- =============================================================================
-- Purpose: Resolve Supabase Linter warnings
-- 1. Remove duplicate RLS policies (Performance)
-- 2. Remove duplicate index (Performance)
-- 3. Move pg_trgm to extensions schema (Security/Best Practice)
-- 4. Optimize RLS policies with (SELECT auth.uid()) (Performance)
-- 
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. REMOVE DUPLICATE POLICIES
-- These old policies exist alongside the new optimized ones, causing double work
-- =============================================================================

-- Projects table duplicates
DROP POLICY IF EXISTS "Projects: Delete Own" ON public.projects;
DROP POLICY IF EXISTS "Projects: Insert Own" ON public.projects;
DROP POLICY IF EXISTS "Projects: Select Own" ON public.projects;
DROP POLICY IF EXISTS "Projects: Update Own" ON public.projects;

-- Hero Lab Data table duplicates
DROP POLICY IF EXISTS "HeroData: Delete Own" ON public.hero_lab_data;
DROP POLICY IF EXISTS "HeroData: Insert Own" ON public.hero_lab_data;
DROP POLICY IF EXISTS "HeroData: Select Own" ON public.hero_lab_data;
DROP POLICY IF EXISTS "HeroData: Update Own" ON public.hero_lab_data;
-- Also try the other common naming pattern just in case
DROP POLICY IF EXISTS "Hero Lab: Delete Own" ON public.hero_lab_data;
DROP POLICY IF EXISTS "Hero Lab: Insert Own" ON public.hero_lab_data;
DROP POLICY IF EXISTS "Hero Lab: Select Own" ON public.hero_lab_data;
DROP POLICY IF EXISTS "Hero Lab: Update Own" ON public.hero_lab_data;

-- =============================================================================
-- 2. REMOVE DUPLICATE INDEX
-- idx_projects_user_archive_updated is identical to idx_projects_user_archived_updated
-- =============================================================================

DROP INDEX IF EXISTS public.idx_projects_user_archive_updated;

-- =============================================================================
-- 3. MOVE EXTENSIONS TO DEDICATED SCHEMA
-- Best practice: Keep public schema for app tables only
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- =============================================================================
-- 4. OPTIMIZE RLS POLICIES (InitPlan)
-- Wrap auth.uid() in (SELECT ...) to prevent row-by-row re-evaluation
-- =============================================================================

-- Projects
DROP POLICY IF EXISTS "projects_owner_all" ON public.projects;
CREATE POLICY "projects_owner_all" ON public.projects
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- Coloring Studio Data
DROP POLICY IF EXISTS "coloring_data_owner" ON public.coloring_studio_data;
CREATE POLICY "coloring_data_owner" ON public.coloring_studio_data
    FOR ALL USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Hero Lab Data
DROP POLICY IF EXISTS "hero_data_owner" ON public.hero_lab_data;
CREATE POLICY "hero_data_owner" ON public.hero_lab_data
    FOR ALL USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Images
DROP POLICY IF EXISTS "images_user_owns" ON public.images;
CREATE POLICY "images_user_owns" ON public.images
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- Workspace Members
DROP POLICY IF EXISTS "workspace_members_select_own" ON public.workspace_members;
CREATE POLICY "workspace_members_select_own" ON public.workspace_members
    FOR SELECT USING (user_id = (SELECT auth.uid()));

COMMIT;
