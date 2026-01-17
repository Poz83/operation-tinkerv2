-- =============================================================================
-- MIGRATION: 008_hero_image_types.sql
-- Description: Expand images.type constraint to support Hero Lab image types
-- =============================================================================

-- Drop the existing constraint
ALTER TABLE public.images DROP CONSTRAINT IF EXISTS images_type_check;

-- Add the updated constraint with all needed types
ALTER TABLE public.images ADD CONSTRAINT images_type_check 
  CHECK (type IN (
    'upload',        -- User uploaded images
    'generated',     -- AI generated images
    'edited',        -- AI edited images
    'page',          -- Coloring book pages
    'hero_base',     -- Hero Lab base/generated images
    'reference',     -- User-uploaded reference images for hero replication
    'profile_sheet'  -- Multi-angle turnaround sheets
  ));

-- =============================================================================
-- MIGRATION COMPLETE
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================
