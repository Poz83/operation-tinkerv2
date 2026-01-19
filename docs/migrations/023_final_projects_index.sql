-- =============================================================================
-- FINAL PROJECTS INDEX FIX - Migration 023
-- =============================================================================
-- The current index is missing tool_type in the filter columns.
-- This creates a perfect covering index for your dashboard query.
-- 
-- YOUR QUERY:
-- SELECT * FROM projects 
-- WHERE user_id = $1 AND tool_type = ANY($2) AND is_archived = $3
-- ORDER BY updated_at DESC
-- =============================================================================

-- Step 1: Drop all existing project indexes (clean slate)
DROP INDEX IF EXISTS idx_projects_dashboard_query;
DROP INDEX IF EXISTS idx_projects_user_id;
DROP INDEX IF EXISTS idx_projects_user_archive_updated;
DROP INDEX IF EXISTS idx_projects_user_archived_updated;
DROP INDEX IF EXISTS idx_projects_user_tool_archived_updated;
DROP INDEX IF EXISTS idx_projects_tool_type;
DROP INDEX IF EXISTS idx_projects_user_query;

-- Step 2: Create the OPTIMAL index for your exact query pattern
-- Columns in order: user_id (equality), is_archived (equality), tool_type (ANY), updated_at (sort)
CREATE INDEX idx_projects_optimal 
ON public.projects (user_id, is_archived, tool_type, updated_at DESC);

-- Step 3: Index for public_id single-project lookups
CREATE INDEX IF NOT EXISTS idx_projects_public_id 
ON public.projects (public_id);

-- Step 4: Update query planner statistics
ANALYZE public.projects;

-- =============================================================================
-- VERIFY (run this after):
-- =============================================================================
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'projects' AND schemaname = 'public';
--
-- Expected: idx_projects_optimal (user_id, is_archived, tool_type, updated_at DESC)
-- =============================================================================
