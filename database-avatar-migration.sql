-- Migration: Replace emoji_avatar with avatar_color_index
-- Run this in Supabase SQL Editor

-- Add new column for avatar color index
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_color_index INTEGER DEFAULT 0;

-- Migrate existing emoji_avatar data (set default color for existing users)
-- This sets all existing users to color index 0 (pastel purple)
UPDATE profiles 
SET avatar_color_index = 0 
WHERE avatar_color_index IS NULL;

-- Note: emoji_avatar column is kept for backward compatibility but not used in new code
-- You can drop it later if needed:
-- ALTER TABLE profiles DROP COLUMN IF EXISTS emoji_avatar;
