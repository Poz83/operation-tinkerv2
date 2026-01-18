-- =============================================================================
-- FIX PROJECTS RLS - CRITICAL 500 ERROR FIX
-- =============================================================================
-- Fixes: 500 Internal Server Error when fetching projects
-- 
-- Root Cause: The workspace subquery in RLS policies can cause issues when:
-- 1. workspace_members table has no matching rows (returns no rows but query fails)
-- 2. The combined OR conditions confuse the query planner
-- 
-- Solution: Ensure simple, direct RLS policies with proper NULL handling
-- 
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- 1. Drop all existing project SELECT policies to start fresh
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view public projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view workspace projects" ON public.projects;
DROP POLICY IF EXISTS "Unified view policy for projects" ON public.projects;

-- 2. Create simple, performant SELECT policies
-- -----------------------------------------------------------------------------

-- Policy A: Users can always view their own projects (most common case)
CREATE POLICY "projects_select_own" ON public.projects
    FOR SELECT USING (user_id = auth.uid());

-- Policy B: Anyone can view public projects
CREATE POLICY "projects_select_public" ON public.projects
    FOR SELECT USING (visibility = 'public');

-- Policy C: Workspace members can view workspace projects
-- Use EXISTS for better performance and NULL safety
CREATE POLICY "projects_select_workspace" ON public.projects
    FOR SELECT USING (
        workspace_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = projects.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- 3. Verify INSERT/UPDATE/DELETE policies exist
-- -----------------------------------------------------------------------------
-- These should already exist from migration 001, but let's ensure they're correct

DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
CREATE POLICY "projects_insert_own" ON public.projects
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "projects_update_own" ON public.projects
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "projects_delete_own" ON public.projects
    FOR DELETE USING (user_id = auth.uid());

-- 4. Ensure workspace_members has a SELECT policy (CRITICAL)
-- -----------------------------------------------------------------------------
-- Without this, the workspace subquery in projects policies will fail!

DROP POLICY IF EXISTS "Users can view own workspace memberships" ON public.workspace_members;
CREATE POLICY "workspace_members_select_own" ON public.workspace_members
    FOR SELECT USING (user_id = auth.uid());

-- 5. Ensure coloring_studio_data and hero_lab_data have proper policies
-- -----------------------------------------------------------------------------
-- These need to be accessible for JOINs in fetchProject

DROP POLICY IF EXISTS "Users can manage coloring_studio_data" ON public.coloring_studio_data;
CREATE POLICY "coloring_studio_data_all" ON public.coloring_studio_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage hero_lab_data" ON public.hero_lab_data;
CREATE POLICY "hero_lab_data_all" ON public.hero_lab_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

-- 6. Ensure images table has proper SELECT policy
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Unified view policy for images" ON public.images;

CREATE POLICY "images_select_own" ON public.images
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "images_select_public_projects" ON public.images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.visibility = 'public'
        )
    );

-- 7. Update statistics for query planner
-- -----------------------------------------------------------------------------
ANALYZE public.projects;
ANALYZE public.workspace_members;
ANALYZE public.coloring_studio_data;
ANALYZE public.hero_lab_data;
ANALYZE public.images;

-- Done!
