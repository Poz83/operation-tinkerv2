-- Migration: 007_hero_lab_dna.sql
-- Description: Updates hero_lab_data to support Character DNA and consistent generation

-- Enable pg_trgm for text search if not already enabled (good for searching characters later)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add new columns to hero_lab_data
ALTER TABLE hero_lab_data
ADD COLUMN IF NOT EXISTS dna JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS base_image_url TEXT,
ADD COLUMN IF NOT EXISTS seed BIGINT;

-- Add valid_dna check constraint to ensure essential fields exist (optional but good for data integrity)
-- We'll keep it flexible for now as the schema might evolve, but ensure it's an object
ALTER TABLE hero_lab_data
ADD CONSTRAINT hero_lab_data_dna_check CHECK (jsonb_typeof(dna) = 'object');

-- Create an index on the character name within the DNA for faster lookups
CREATE INDEX IF NOT EXISTS idx_hero_lab_data_dna_name ON hero_lab_data ((dna->>'name'));

-- Comment on columns for clarity
COMMENT ON COLUMN hero_lab_data.dna IS 'JSONB object containing Character DNA traits (name, role, face, eyes, hair, skin, body, signature_features, outfit_canon, style_lock)';
COMMENT ON COLUMN hero_lab_data.base_image_url IS 'URL of the reference image used as the visual anchor';
COMMENT ON COLUMN hero_lab_data.seed IS 'Seed value used for consistent generation';
