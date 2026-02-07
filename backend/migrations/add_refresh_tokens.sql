-- Migration: Add Refresh Tokens System
-- Date: 2026-02-07
-- Purpose: Implement secure refresh token system with automatic rotation

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),
    replaced_by_token TEXT REFERENCES refresh_tokens(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked) WHERE revoked = FALSE;

-- Token blacklist for additional security (for access tokens)
CREATE TABLE IF NOT EXISTS token_blacklist (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    token_jti VARCHAR(255) NOT NULL UNIQUE, -- JWT ID
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    reason VARCHAR(255)
);

-- Index for fast blacklist lookups
CREATE INDEX idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Function to clean up expired tokens automatically
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired refresh tokens
    DELETE FROM refresh_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days'; -- Keep for 7 days after expiration for audit
    
    -- Delete expired blacklist entries
    DELETE FROM token_blacklist
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for JWT authentication with automatic rotation';
COMMENT ON COLUMN refresh_tokens.token IS 'Hashed refresh token (bcrypt)';
COMMENT ON COLUMN refresh_tokens.replaced_by_token IS 'Points to new token when this one is rotated';
COMMENT ON COLUMN refresh_tokens.revoked IS 'If true, token has been manually revoked';
COMMENT ON TABLE token_blacklist IS 'Blacklist for revoked access tokens (JWT)';

-- Grant permissions (adjust role names as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON refresh_tokens TO your_app_role;
-- GRANT SELECT, INSERT, DELETE ON token_blacklist TO your_app_role;

-- Success message
SELECT 'Refresh tokens system created successfully!' AS message;
