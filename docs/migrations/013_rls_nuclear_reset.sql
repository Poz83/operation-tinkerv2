-- =============================================================================
-- RLS NUCLEAR RESET - Migration 013
-- =============================================================================
-- Purpose: Complete idempotent reset of all RLS policies to fix 500 errors
-- 
-- This migration is SAFE TO RUN MULTIPLE TIMES - it drops before creating
-- 
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: NUKE ALL EXISTING POLICIES ON KEY TABLES
-- =============================================================================

-- Projects table
DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
DROP POLICY IF EXISTS "projects_select_public" ON public.projects;
DROP POLICY IF EXISTS "projects_select_workspace" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view public projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view workspace projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Unified view policy for projects" ON public.projects;

-- Images table
DROP POLICY IF EXISTS "images_user_owns" ON public.images;
DROP POLICY IF EXISTS "images_select_own" ON public.images;
DROP POLICY IF EXISTS "images_select_public_projects" ON public.images;
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Users can create own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;
DROP POLICY IF EXISTS "Unified view policy for images" ON public.images;
DROP POLICY IF EXISTS "Anyone can view images from public projects" ON public.images;

-- Coloring Studio Data
DROP POLICY IF EXISTS "coloring_data_via_project" ON public.coloring_studio_data;
DROP POLICY IF EXISTS "coloring_studio_data_all" ON public.coloring_studio_data;
DROP POLICY IF EXISTS "Users can manage coloring_studio_data" ON public.coloring_studio_data;

-- Hero Lab Data
DROP POLICY IF EXISTS "hero_data_via_project" ON public.hero_lab_data;
DROP POLICY IF EXISTS "hero_lab_data_all" ON public.hero_lab_data;
DROP POLICY IF EXISTS "Users can manage hero_lab_data" ON public.hero_lab_data;
DROP POLICY IF EXISTS "Users can view their own hero data" ON public.hero_lab_data;
DROP POLICY IF EXISTS "Users can insert their own hero data" ON public.hero_lab_data;
DROP POLICY IF EXISTS "Users can update their own hero data" ON public.hero_lab_data;

-- Workspace Members
DROP POLICY IF EXISTS "workspace_members_select_own" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view own workspace memberships" ON public.workspace_members;

-- =============================================================================
-- STEP 2: CREATE CLEAN POLICIES
-- =============================================================================

-- ---- PROJECTS TABLE ----
CREATE POLICY "projects_select_own" ON public.projects
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "projects_select_public" ON public.projects
    FOR SELECT USING (visibility = 'public');

CREATE POLICY "projects_insert_own" ON public.projects
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update_own" ON public.projects
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "projects_delete_own" ON public.projects
    FOR DELETE USING (user_id = auth.uid());

-- ---- IMAGES TABLE ----
-- Simple direct user_id check (fast, no subquery)
CREATE POLICY "images_user_owns" ON public.images
    FOR ALL USING (user_id = auth.uid());

-- ---- COLORING STUDIO DATA ----
CREATE POLICY "coloring_data_via_project" ON public.coloring_studio_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

-- ---- HERO LAB DATA ----
CREATE POLICY "hero_data_via_project" ON public.hero_lab_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

-- ---- WORKSPACE MEMBERS ----
CREATE POLICY "workspace_members_select_own" ON public.workspace_members
    FOR SELECT USING (user_id = auth.uid());

-- =============================================================================
-- STEP 3: ENSURE RLS IS ENABLED ON ALL TABLES
-- =============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coloring_studio_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_lab_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: UPDATE STATISTICS
-- =============================================================================

ANALYZE public.projects;
ANALYZE public.images;
ANALYZE public.coloring_studio_data;
ANALYZE public.hero_lab_data;
ANALYZE public.workspace_members;

COMMIT;

-- =============================================================================
-- VERIFICATION (run after to confirm)
-- =============================================================================
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('projects', 'images', 'coloring_studio_data', 'hero_lab_data')
-- ORDER BY tablename, policyname;
