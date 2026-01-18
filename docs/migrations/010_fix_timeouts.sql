-- =============================================================================
-- FIX TIMEOUTS & MISSING RLS - FINAL
-- =============================================================================
-- Fixes: 
-- 1. 57014 Statement Timeout on Projects table (via Indexing + Policy Split)
-- 2. Missing RLS policy on workspace_members (preventing workspace access)
-- 
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- 1. Optimize "My Projects" Query Indexing
-- -----------------------------------------------------------------------------
-- This specific index covers the Dashboard query pattern:
-- WHERE user_id = ? AND is_archived = false ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_projects_user_archive_updated 
ON public.projects(user_id, is_archived, updated_at DESC);

-- 2. Optimize Workspace RLS Lookup
-- -----------------------------------------------------------------------------
-- Crucial for the workspace permissions check.
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id 
ON public.workspace_members(user_id);

-- 3. Fix Missing Workspace Member Policy
-- -----------------------------------------------------------------------------
-- Migration 001 enabled RLS on workspace_members but didn't add a policy.
-- This effectively blocked ALL access to workspace membership data.
-- We verify if it exists first to avoid errors.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workspace_members' AND policyname = 'Users can view own workspace memberships'
    ) THEN
        CREATE POLICY "Users can view own workspace memberships" ON public.workspace_members
            FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

-- 4. RLS Strategy Change (Split for Performance)
-- -----------------------------------------------------------------------------
-- The "Unified" policy uses OR conditions that can confuse the query planner.
-- We revert to granular policies to ensure best index usage.

-- Drop the unified policy (from migration 003)
DROP POLICY IF EXISTS "Unified view policy for projects" ON public.projects;

-- Re-implement granular policies
-- A. Own Projects (Direct constant lookup, very fast with user_id index)
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (user_id = auth.uid());

-- B. Public Projects (Direct constant lookup)
DROP POLICY IF EXISTS "Users can view public projects" ON public.projects;
CREATE POLICY "Users can view public projects" ON public.projects
    FOR SELECT USING (visibility = 'public');

-- C. Workspace Projects (Semi-join optimized with idx_workspace_members_user_id)
DROP POLICY IF EXISTS "Users can view workspace projects" ON public.projects;
CREATE POLICY "Users can view workspace projects" ON public.projects
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- 5. Update Table Statistics
-- -----------------------------------------------------------------------------
-- Force the planner to see the new indexes and data distribution immediately.
ANALYZE public.projects;
ANALYZE public.workspace_members;
