-- =============================================================================
-- CLEANUP DUPLICATE RLS POLICIES - Migration 015
-- =============================================================================
-- Purpose: Remove ALL old policies with different naming conventions
-- 
-- PROBLEM: Old policies "Projects: X Own" exist alongside new "projects_x" policies
-- The old ones use slow subquery pattern: (SELECT auth.uid() AS uid) = user_id
-- 
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: DROP ALL OLD "Projects: X" NAMED POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Projects: Insert Own" ON public.projects;
DROP POLICY IF EXISTS "Projects: Update Own" ON public.projects;
DROP POLICY IF EXISTS "Projects: Delete Own" ON public.projects;
DROP POLICY IF EXISTS "Projects: Select Own" ON public.projects;

-- Also drop any other variants that might exist
DROP POLICY IF EXISTS "Projects: View Own" ON public.projects;
DROP POLICY IF EXISTS "Projects: All Own" ON public.projects;

-- =============================================================================
-- STEP 2: VERIFY ONLY OPTIMIZED POLICIES REMAIN
-- =============================================================================

-- At this point, only these should exist:
-- - projects_owner_all (FOR ALL, fast)
-- - projects_public_select (FOR SELECT, fast)

-- =============================================================================
-- STEP 3: UPDATE STATISTICS
-- =============================================================================

ANALYZE public.projects;

COMMIT;

-- =============================================================================
-- VERIFICATION (run after)
-- =============================================================================
-- SELECT policyname, cmd, qual FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'projects';
--
-- Expected result: Only 2 policies with direct checks (no subqueries)
