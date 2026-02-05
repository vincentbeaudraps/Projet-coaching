-- Migration to fix activity duration
-- Duration was stored in minutes instead of seconds for GPX imports
-- This migration multiplies duration by 60 for all activities from 'gpx' source

-- Backup note: This affects only activities with source = 'gpx'
-- Manual activities should have correct duration in seconds

UPDATE completed_activities 
SET duration = duration * 60
WHERE source = 'gpx' 
  AND duration < 7200; -- Only fix if duration seems to be in minutes (less than 2 hours in seconds)

-- Add a comment for documentation
COMMENT ON COLUMN completed_activities.duration IS 'Duration in seconds';
