-- =============================================================================
-- FIX RLS PERFORMANCE - Migration 014
-- =============================================================================
-- Purpose: Eliminate RLS timeout (57014) by removing all subqueries from policies
-- 
-- ROOT CAUSE: The workspace check subquery runs for EVERY row, causing O(n) queries
-- SOLUTION: Remove workspace policy entirely (not used), keep only direct checks
-- 
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: DROP ALL EXISTING PROJECT POLICIES
-- =============================================================================

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

-- =============================================================================
-- STEP 2: CREATE MINIMAL, FAST POLICIES (NO SUBQUERIES)
-- =============================================================================

-- Policy 1: Users see their own projects (direct column check, uses index)
CREATE POLICY "projects_owner_all" ON public.projects
    FOR ALL USING (user_id = auth.uid());

-- Policy 2: Anyone can see public projects (direct column check)
CREATE POLICY "projects_public_select" ON public.projects
    FOR SELECT USING (visibility = 'public');

-- NOTE: Workspace policy REMOVED - it was causing the timeout
-- If workspace sharing is needed later, implement via a SECURITY DEFINER function

-- =============================================================================
-- STEP 3: FIX RELATED TABLES (coloring_studio_data, hero_lab_data)
-- =============================================================================
-- These use EXISTS subqueries which are more efficient than IN subqueries
-- But we'll also add indexes to make them faster

DROP POLICY IF EXISTS "coloring_data_via_project" ON public.coloring_studio_data;
DROP POLICY IF EXISTS "coloring_studio_data_all" ON public.coloring_studio_data;
DROP POLICY IF EXISTS "hero_data_via_project" ON public.hero_lab_data;
DROP POLICY IF EXISTS "hero_lab_data_all" ON public.hero_lab_data;

-- Coloring Studio Data: Check via project ownership
CREATE POLICY "coloring_data_owner" ON public.coloring_studio_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id 
            AND p.user_id = auth.uid()
        )
    );

-- Hero Lab Data: Check via project ownership  
CREATE POLICY "hero_data_owner" ON public.hero_lab_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id 
            AND p.user_id = auth.uid()
        )
    );

-- =============================================================================
-- STEP 4: ADD CRITICAL INDEXES
-- =============================================================================

-- Primary index for user project lookups (covers the dashboard query)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Composite index for filtered sorted queries
CREATE INDEX IF NOT EXISTS idx_projects_user_archived_updated 
    ON public.projects(user_id, is_archived, updated_at DESC);

-- Tool type filter index
CREATE INDEX IF NOT EXISTS idx_projects_tool_type ON public.projects(tool_type);

-- Foreign key indexes for the related tables (speeds up EXISTS checks)
CREATE INDEX IF NOT EXISTS idx_coloring_studio_data_project_id 
    ON public.coloring_studio_data(project_id);
CREATE INDEX IF NOT EXISTS idx_hero_lab_data_project_id 
    ON public.hero_lab_data(project_id);

-- =============================================================================
-- STEP 5: UPDATE STATISTICS
-- =============================================================================

ANALYZE public.projects;
ANALYZE public.coloring_studio_data;
ANALYZE public.hero_lab_data;

COMMIT;

-- =============================================================================
-- VERIFICATION (run after to confirm)
-- =============================================================================
-- Check policies:
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('projects', 'coloring_studio_data', 'hero_lab_data')
-- ORDER BY tablename;

-- Check indexes:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'projects' AND schemaname = 'public';

-- Test the query directly (should be fast now):
-- EXPLAIN ANALYZE
-- SELECT id, public_id, title, description, cover_image_url, user_id, visibility, 
--        created_at, updated_at, tool_type
-- FROM projects
-- WHERE user_id = '45cd0f3c-d5ce-40dc-8d8e-e72295e90b32'
-- AND tool_type IN ('coloring_studio', 'hero_lab')
-- AND is_archived = false
-- ORDER BY updated_at DESC;
