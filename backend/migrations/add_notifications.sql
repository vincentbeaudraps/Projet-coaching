-- Notifications System Migration
-- Date: 2026-02-06
-- Purpose: In-app notification system for coaches and athletes

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'new_session',
    'session_modified',
    'session_deleted',
    'new_message',
    'activity_completed',
    'goal_achieved',
    'record_broken',
    'invitation_accepted',
    'feedback_received'
  )),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  related_id TEXT, -- ID of related entity (session, message, etc.)
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Example notifications
-- INSERT INTO notifications (id, user_id, type, title, message, link, read) VALUES
-- ('notif1', 'user123', 'new_session', 'Nouvelle séance', 'Ton coach t''a assigné une séance', '/sessions/session123', false);
