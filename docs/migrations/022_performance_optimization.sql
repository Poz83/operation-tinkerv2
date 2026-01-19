-- =============================================================================
-- COMPREHENSIVE PERFORMANCE OPTIMIZATION - Migration 022
-- =============================================================================
-- Purpose: Fix Disk IO exhaustion by optimizing indexes and RLS policies
-- 
-- PROBLEM: Projects query taking 5,847ms (should be <50ms)
-- ROOT CAUSE: Missing/ineffective indexes + RLS policy overhead
-- 
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 1: DROP CONFLICTING/REDUNDANT INDEXES
-- =============================================================================
-- Remove old indexes before creating optimized ones to avoid conflicts

DROP INDEX IF EXISTS idx_projects_user_id;
DROP INDEX IF EXISTS idx_projects_user_archive_updated;
DROP INDEX IF EXISTS idx_projects_user_archived_updated;
DROP INDEX IF EXISTS idx_projects_tool_type;
DROP INDEX IF EXISTS idx_projects_user_query;

-- =============================================================================
-- STEP 2: CREATE OPTIMIZED INDEXES FOR PROJECTS
-- =============================================================================

-- PRIMARY: Composite index covering the main dashboard query pattern
-- Query: SELECT * FROM projects WHERE user_id = ? AND tool_type = ANY(?) 
--        AND is_archived = false ORDER BY updated_at DESC
-- NOTE: Removed INCLUDE clause - TEXT columns exceeded 8KB index row limit
CREATE INDEX idx_projects_dashboard_query 
ON public.projects (user_id, is_archived, updated_at DESC);

-- SECONDARY: Index for public_id lookups (used for fetching single projects)
CREATE INDEX IF NOT EXISTS idx_projects_public_id 
ON public.projects (public_id);

-- SECONDARY: Tool type filter (rarely used alone, but helps some queries)
CREATE INDEX IF NOT EXISTS idx_projects_tool_type 
ON public.projects (tool_type) 
WHERE is_archived = false;

-- =============================================================================
-- STEP 3: CREATE OPTIMIZED INDEXES FOR RELATED TABLES
-- =============================================================================

-- Images: User lookup for gallery/dashboard
DROP INDEX IF EXISTS idx_images_user_id;
DROP INDEX IF EXISTS idx_images_project_id;
CREATE INDEX idx_images_user_project 
ON public.images (user_id, project_id, created_at DESC);

-- Coloring Studio Data: FK lookup
CREATE INDEX IF NOT EXISTS idx_coloring_studio_data_project 
ON public.coloring_studio_data (project_id);

-- Hero Lab Data: FK lookup
CREATE INDEX IF NOT EXISTS idx_hero_lab_data_project 
ON public.hero_lab_data (project_id);

-- Generations: User's generation history
CREATE INDEX IF NOT EXISTS idx_generations_user_created 
ON public.generations (user_id, created_at DESC);

-- =============================================================================
-- STEP 4: RESET RLS POLICIES (CLEAN SLATE)
-- =============================================================================
-- Remove ALL existing policies and create minimal, efficient ones

-- Drop all projects policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'projects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', pol.policyname);
    END LOOP;
END $$;

-- Drop all images policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'images'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.images', pol.policyname);
    END LOOP;
END $$;

-- Drop all coloring_studio_data policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'coloring_studio_data'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.coloring_studio_data', pol.policyname);
    END LOOP;
END $$;

-- Drop all hero_lab_data policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'hero_lab_data'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.hero_lab_data', pol.policyname);
    END LOOP;
END $$;

-- =============================================================================
-- STEP 5: CREATE MINIMAL RLS POLICIES
-- =============================================================================
-- PRINCIPLE: Direct column checks only, NO subqueries in hot paths

-- PROJECTS: Owner has full access (uses index on user_id)
CREATE POLICY "projects_owner" ON public.projects
    FOR ALL 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- PROJECTS: Public visibility (direct column check)
CREATE POLICY "projects_public_read" ON public.projects
    FOR SELECT 
    USING (visibility = 'public');

-- IMAGES: Owner has full access
CREATE POLICY "images_owner" ON public.images
    FOR ALL 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- COLORING_STUDIO_DATA: Access via project ownership
-- Uses correlated subquery but project lookup is indexed
CREATE POLICY "coloring_data_owner" ON public.coloring_studio_data
    FOR ALL 
    USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = auth.uid()
        )
    );

-- HERO_LAB_DATA: Access via project ownership
CREATE POLICY "hero_data_owner" ON public.hero_lab_data
    FOR ALL 
    USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- STEP 6: ENSURE RLS IS ENABLED
-- =============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coloring_studio_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_lab_data ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 7: UPDATE STATISTICS
-- =============================================================================

ANALYZE public.projects;
ANALYZE public.images;
ANALYZE public.coloring_studio_data;
ANALYZE public.hero_lab_data;
ANALYZE public.generations;

-- =============================================================================
-- VERIFICATION QUERIES (Run these after to confirm)
-- =============================================================================

-- Check indexes on projects:
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'projects' AND schemaname = 'public';

-- Check policies:
-- SELECT tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('projects', 'images', 'coloring_studio_data', 'hero_lab_data');

-- Test query performance (replace UUID with your user_id):
-- EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
-- SELECT id, public_id, title, cover_image_url, user_id, visibility, 
--        created_at, updated_at, tool_type
-- FROM projects
-- WHERE user_id = 'YOUR-USER-UUID-HERE'
-- AND tool_type IN ('coloring_studio', 'hero_lab')
-- AND is_archived = false
-- ORDER BY updated_at DESC
-- LIMIT 50;
