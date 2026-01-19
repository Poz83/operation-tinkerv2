-- =============================================================================
-- RLS CONSOLIDATION - Migration 018
-- =============================================================================
-- Purpose: Resolve "Multiple Permissive Policies" linter violation
-- 
-- STRATEGY: 
-- Separate "ReadOnly" (SELECT) and "Write" (INSERT/UPDATE/DELETE) logic
-- to avoid overlapping permissions triggering the linter.
-- 
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

BEGIN;

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "projects_owner_all" ON public.projects;
DROP POLICY IF EXISTS "projects_public_select" ON public.projects;

-- 1. WRITE Policy (Owner only) - INSERT, UPDATE, DELETE
CREATE POLICY "projects_write_own" ON public.projects
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- 2. READ Policy (Owner OR Public) - SELECT only
-- Using OR condition to combine permissions into a single policy
CREATE POLICY "projects_read_access" ON public.projects
    FOR SELECT
    USING (
        user_id = (SELECT auth.uid()) OR 
        visibility = 'public'
    );

COMMIT;
