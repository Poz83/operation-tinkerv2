-- =============================================================================
-- SCHEMA OPTIMIZATION - Migration 016
-- =============================================================================
-- Purpose: Add missing indexes for performance optimization
-- 
-- Supabase Plan: Pro Micro (2 CPU, 1GB RAM)
-- Note: Using regular CREATE INDEX (not CONCURRENTLY) for Supabase SQL Editor
-- 
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: FOREIGN KEY INDEXES (CRITICAL)
-- PostgreSQL does NOT auto-create indexes on FK columns
-- =============================================================================

-- Images table (heavily queried)
CREATE INDEX IF NOT EXISTS idx_images_project_id 
    ON public.images(project_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id 
    ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_type 
    ON public.images(type);

-- Generations table
CREATE INDEX IF NOT EXISTS idx_generations_project_id 
    ON public.generations(project_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_id 
    ON public.generations(user_id);

-- Feedback table
CREATE INDEX IF NOT EXISTS idx_feedback_user_id 
    ON public.feedback(user_id);

-- KDP Exports table
CREATE INDEX IF NOT EXISTS idx_kdp_exports_project_id 
    ON public.kdp_exports(project_id);
CREATE INDEX IF NOT EXISTS idx_kdp_exports_user_id 
    ON public.kdp_exports(user_id);

-- User Sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
    ON public.user_sessions(user_id);

-- Security Events table
CREATE INDEX IF NOT EXISTS idx_security_events_user_id 
    ON public.security_events(user_id);

-- =============================================================================
-- PART 2: COMPOSITE INDEXES (Query Patterns)
-- These speed up common multi-column queries
-- =============================================================================

-- Images by project and type (e.g., "pages" for a project)
CREATE INDEX IF NOT EXISTS idx_images_project_type 
    ON public.images(project_id, type);

-- Generations by status for monitoring/retry
CREATE INDEX IF NOT EXISTS idx_generations_status_created 
    ON public.generations(status, created_at DESC);

-- Active user sessions lookup
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_current 
    ON public.user_sessions(user_id, is_current) WHERE is_current = true;

-- Feedback by status for admin dashboard
CREATE INDEX IF NOT EXISTS idx_feedback_status_created 
    ON public.feedback(status, created_at DESC);

-- Projects by visibility (for public gallery, if used)
CREATE INDEX IF NOT EXISTS idx_projects_visibility 
    ON public.projects(visibility) WHERE visibility = 'public';

-- Projects by share_token (for shared link lookups)
CREATE INDEX IF NOT EXISTS idx_projects_share_token 
    ON public.projects(share_token) WHERE share_token IS NOT NULL;

-- =============================================================================
-- PART 3: TIMESTAMPED TABLES (Audit trails)
-- For time-range queries on log/audit tables
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created 
    ON public.admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_created 
    ON public.security_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generations_created 
    ON public.generations(created_at DESC);

-- =============================================================================
-- PART 4: UPDATE STATISTICS
-- =============================================================================

ANALYZE public.images;
ANALYZE public.generations;
ANALYZE public.feedback;
ANALYZE public.user_sessions;
ANALYZE public.security_events;
ANALYZE public.projects;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERY (Run after migration)
-- =============================================================================
-- SELECT tablename, indexname FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
