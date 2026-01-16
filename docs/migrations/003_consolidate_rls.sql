-- =============================================================================
-- CONSOLIDATE RLS POLICIES - Performance Optimization
-- =============================================================================
-- Fixes "Multiple Permissive Policies" warnings by merging public/private access rules
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- 1. IMAGES TABLE
-- Drop existing separate policies
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Anyone can view images from public projects" ON public.images;

-- Create unified policy
DROP POLICY IF EXISTS "Unified view policy for images" ON public.images;
CREATE POLICY "Unified view policy for images" ON public.images
    FOR SELECT USING (
        (user_id = (SELECT auth.uid())) -- Own images
        OR
        (project_id IN ( -- Images from public projects
            SELECT id FROM public.projects WHERE visibility = 'public'
        ))
    );

-- 2. PROJECTS TABLE
-- Drop existing separate policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can view public projects" ON public.projects;

-- Create unified policy
DROP POLICY IF EXISTS "Unified view policy for projects" ON public.projects;
CREATE POLICY "Unified view policy for projects" ON public.projects
    FOR SELECT USING (
        (user_id = (SELECT auth.uid())) -- Own projects
        OR
        (visibility = 'public') -- Public projects
        OR
        (workspace_id IN ( -- Workspace projects
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = (SELECT auth.uid())
        ))
    );

-- 3. USERS TABLE
-- Drop existing separate policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view display names for attribution" ON public.users;

-- Create unified policy (Allow reading profiles for attribution)
DROP POLICY IF EXISTS "Unified view policy for users" ON public.users;
CREATE POLICY "Unified view policy for users" ON public.users
    FOR SELECT USING (TRUE);
