-- Add settings JSONB column to store flexible project configuration
-- (Character DNA, Style References, Consistency Settings, etc.)

ALTER TABLE coloring_studio_data 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

ALTER TABLE hero_lab_data 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Comment on columns
COMMENT ON COLUMN coloring_studio_data.settings IS 'Stores flexible project settings like characterDNA, styleReferences, heroPresence, etc.';
COMMENT ON COLUMN hero_lab_data.settings IS 'Stores flexible hero configuration and extra metadata.';
