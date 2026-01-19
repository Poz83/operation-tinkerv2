-- =============================================================================
-- EMERGENCY RLS DIAGNOSTIC - Migration 021
-- =============================================================================
-- This script TEMPORARILY DISABLES RLS to confirm if RLS is the 500 cause.
-- After confirming, we'll re-enable with ultra-simple policies.
-- =============================================================================

-- Step 1: Check current policies (Run this first to see what exists)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'projects';

-- Step 2: DISABLE RLS on projects table (TEMPORARY - FOR TESTING ONLY)
-- This will allow all authenticated users to see all projects temporarily.
-- DO NOT LEAVE THIS IN PRODUCTION!
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- After running this, reload your app. 
-- If 500 errors are GONE, then RLS was the problem.
-- If 500 errors PERSIST, then the issue is elsewhere (index, query, etc.)

-- =============================================================================
-- RUN THE ABOVE FIRST AND TEST. IF 500 IS GONE, RUN THE BELOW TO FIX PROPERLY:
-- =============================================================================

-- Step 3: Drop ALL existing policies (nuclear clean)
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

-- Step 4: Re-enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Step 5: Create ONE ultra-simple policy using helper function
-- First, create a fast helper function if not exists
CREATE OR REPLACE FUNCTION public.is_owner(project_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = project_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 6: Single policy using the fast function
CREATE POLICY "owner_access" ON public.projects
    FOR ALL
    USING (public.is_owner(user_id))
    WITH CHECK (public.is_owner(user_id));

-- Step 7: Verify
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'projects';
