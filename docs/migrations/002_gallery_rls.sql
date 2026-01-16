-- =============================================================================
-- GALLERY RLS POLICY - Allow viewing images from public projects
-- =============================================================================
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- Allow anyone (authenticated or not) to view images from PUBLIC projects
-- This enables the community gallery feature
CREATE POLICY "Anyone can view images from public projects" ON public.images
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects WHERE visibility = 'public'
        )
    );

-- Also allow viewing the project metadata for public projects
CREATE POLICY "Anyone can view public projects" ON public.projects
    FOR SELECT USING (visibility = 'public');

-- Allow viewing user display names for attribution (limited fields)
-- Note: This policy already exists for own profile, we need one for public display
CREATE POLICY "Anyone can view display names for attribution" ON public.users
    FOR SELECT USING (TRUE);
-- If you want to limit visible fields, use a VIEW instead
