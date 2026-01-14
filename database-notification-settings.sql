-- Add notification settings to bets table
-- Run this in Supabase SQL Editor

-- Add notification time and frequency columns
ALTER TABLE bets
ADD COLUMN IF NOT EXISTS notification_time TIME DEFAULT '18:00:00',
ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'daily' CHECK (notification_frequency IN ('daily', 'weekly', 'custom'));

-- Update existing bets to have default notification settings
UPDATE bets
SET notification_time = '18:00:00', notification_frequency = 'daily'
WHERE notification_time IS NULL OR notification_frequency IS NULL;

-- Create index for notification queries
CREATE INDEX IF NOT EXISTS idx_bets_notification_time ON bets(notification_time);
CREATE INDEX IF NOT EXISTS idx_bets_notification_frequency ON bets(notification_frequency);
