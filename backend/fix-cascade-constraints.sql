-- Fix missing CASCADE constraints for athlete deletion
-- This will allow proper deletion of athletes

-- First, check if completed_activities table exists and needs fixing
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'completed_activities') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE completed_activities 
        DROP CONSTRAINT IF EXISTS completed_activities_athlete_id_fkey;
        
        -- Add new constraint with CASCADE
        ALTER TABLE completed_activities
        ADD CONSTRAINT completed_activities_athlete_id_fkey
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Fixed completed_activities constraint';
    END IF;
END $$;

-- Check and fix messages table
DO $$
BEGIN
    -- Messages sent by athletes should be deleted when athlete is deleted
    ALTER TABLE messages
    DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
    
    ALTER TABLE messages
    ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
    
    ALTER TABLE messages
    DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
    
    ALTER TABLE messages
    ADD CONSTRAINT messages_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Fixed messages constraints';
END $$;

-- Check and fix athlete_metrics_history if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'athlete_metrics_history') THEN
        ALTER TABLE athlete_metrics_history
        DROP CONSTRAINT IF EXISTS athlete_metrics_history_athlete_id_fkey;
        
        ALTER TABLE athlete_metrics_history
        ADD CONSTRAINT athlete_metrics_history_athlete_id_fkey
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Fixed athlete_metrics_history constraint';
    END IF;
END $$;

-- Check and fix connected_platforms if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connected_platforms') THEN
        ALTER TABLE connected_platforms
        DROP CONSTRAINT IF EXISTS connected_platforms_athlete_id_fkey;
        
        ALTER TABLE connected_platforms
        ADD CONSTRAINT connected_platforms_athlete_id_fkey
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Fixed connected_platforms constraint';
    END IF;
END $$;

SELECT 'All CASCADE constraints have been fixed!' AS result;
