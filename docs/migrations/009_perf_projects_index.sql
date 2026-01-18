-- =============================================================================
-- PERFORMANCE OPTIMIZATION - PROJECTS INDEX
-- =============================================================================
-- Fixes: Timeout (57014) on "My Projects" dashboard query
-- Query: select * from projects where user_id = ? and is_archived = false order by updated_at desc
-- =============================================================================

-- Create composite index for the dashboard filter + sort
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_archive_updated 
ON public.projects(user_id, is_archived, updated_at DESC);

-- Explanation:
-- 1. user_id: First usage in WHERE clause (high cardinality)
-- 2. is_archived: Second usage in WHERE clause (low cardinality)
-- 3. updated_at DESC: Used for ORDER BY, allows index scan to avoid sorting
