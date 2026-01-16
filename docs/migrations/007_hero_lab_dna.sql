-- Migration: 007_hero_lab_dna.sql
-- Description: Updates hero_lab_data to support Character DNA and consistent generation

-- 1. Ensure projects table has tool_type
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tool_type TEXT DEFAULT 'coloring_studio';

-- 2. Create hero_lab_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS hero_lab_data (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    dna JSONB DEFAULT '{}'::jsonb,
    base_image_url TEXT,
    seed BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add constraint to dna column if table exists (idempotent because table creation includes defaults)
-- But if table existed previously without constraint:
-- ALTER TABLE hero_lab_data ADD CONSTRAINT hero_lab_data_dna_check CHECK (jsonb_typeof(dna) = 'object');
-- (Skipping explicit constraint addition to avoid "relation already exists" complexity for simple SQL runner, 
--  creation above is sufficient for new envs)

-- 4. Create RLS Policies
ALTER TABLE hero_lab_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Users can view their own hero data" ON hero_lab_data;
DROP POLICY IF EXISTS "Users can insert their own hero data" ON hero_lab_data;
DROP POLICY IF EXISTS "Users can update their own hero data" ON hero_lab_data;

CREATE POLICY "Users can view their own hero data" ON hero_lab_data
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM projects WHERE id = hero_lab_data.project_id)
  );

CREATE POLICY "Users can insert their own hero data" ON hero_lab_data
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM projects WHERE id = hero_lab_data.project_id)
  );

CREATE POLICY "Users can update their own hero data" ON hero_lab_data
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM projects WHERE id = hero_lab_data.project_id)
  );

-- 5. Indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_hero_lab_data_dna_name ON hero_lab_data ((dna->>'name'));
