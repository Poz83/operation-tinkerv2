-- =============================================================================
-- FIX DUPLICATE RLS POLICIES - Migration 026
-- =============================================================================
-- Purpose: Resolve Supabase Linter warnings "Multiple Permissive Policies"
-- Problem: 'projects_owner' (ALL) and 'projects_public_read' (SELECT) both applied
-- to SELECT queries, causing performance overhead.
-- Solution: Split policies by action to ensure zero overlap.

-- 1. Drop existing overlapping policies
DROP POLICY IF EXISTS "projects_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_public_read" ON public.projects;

-- 2. Create Consolidated READ Policy (Select)
-- Handles both "My Projects" and "Public Projects" in one optimised check
CREATE POLICY "projects_select" ON public.projects
    FOR SELECT
    USING (
        user_id = auth.uid()      -- Owner
        OR 
        visibility = 'public'     -- Public
    );

-- 3. Create Specific WRITE Policies (Insert/Update/Delete)
-- Formerly handled by 'projects_owner' (ALL)

CREATE POLICY "projects_insert" ON public.projects
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update" ON public.projects
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_delete" ON public.projects
    FOR DELETE
    USING (user_id = auth.uid());

-- 4. Verify Policy Unification
-- SELECT * FROM pg_policies WHERE tablename = 'projects';
