// Refresh Token Service
// Handles refresh token generation, rotation, and revocation
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import client from '../database/connection.js';
import { generateId } from '../utils/id.js';

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface RefreshTokenData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface TokenMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate a cryptographically secure refresh token
 */
function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Hash a refresh token before storing in database
 */
async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

/**
 * Verify a refresh token against its hash
 */
async function verifyToken(token: string, hashedToken: string): Promise<boolean> {
  return bcrypt.compare(token, hashedToken);
}

/**
 * Create a new refresh token for a user
 */
export async function createRefreshToken(
  userId: string,
  metadata?: TokenMetadata
): Promise<string> {
  const token = generateRefreshToken();
  const hashedToken = await hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);
  const tokenId = generateId();

  await client.query(
    `INSERT INTO refresh_tokens 
     (id, user_id, token, expires_at, ip_address, user_agent) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [tokenId, userId, hashedToken, expiresAt, metadata?.ipAddress, metadata?.userAgent]
  );

  return token; // Return unhashed token to client
}

/**
 * Verify and consume a refresh token (with rotation)
 */
export async function verifyRefreshToken(
  token: string,
  metadata?: TokenMetadata
): Promise<{ valid: boolean; userId?: string; newToken?: string; error?: string }> {
  try {
    // Find all active refresh tokens (not revoked, not expired)
    const result = await client.query(
      `SELECT id, user_id, token, expires_at, revoked 
       FROM refresh_tokens 
       WHERE revoked = FALSE 
       AND expires_at > NOW()
       ORDER BY created_at DESC`
    );

    // Try to match the provided token with stored hashed tokens
    for (const row of result.rows) {
      const isValid = await verifyToken(token, row.token);
      
      if (isValid) {
        const tokenId = row.id;
        const userId = row.user_id;

        // Token is valid - rotate it (create new one, revoke old one)
        const newToken = await rotateRefreshToken(tokenId, userId, metadata);

        // Update last used timestamp
        await client.query(
          'UPDATE refresh_tokens SET last_used_at = NOW() WHERE id = $1',
          [tokenId]
        );

        return {
          valid: true,
          userId,
          newToken,
        };
      }
    }

    // Check if token was revoked (potential replay attack)
    const revokedCheck = await client.query(
      'SELECT id, user_id FROM refresh_tokens WHERE revoked = TRUE',
    );

    for (const row of revokedCheck.rows) {
      const isRevoked = await verifyToken(token, row.token);
      if (isRevoked) {
        // This is a replay attack attempt - revoke all tokens for this user
        await revokeAllUserTokens(row.user_id, 'replay_attack_detected');
        
        return {
          valid: false,
          error: 'Token has been revoked. All sessions terminated for security.',
        };
      }
    }

    return {
      valid: false,
      error: 'Invalid or expired refresh token',
    };
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return {
      valid: false,
      error: 'Token verification failed',
    };
  }
}

/**
 * Rotate a refresh token (issue new one, revoke old one)
 */
async function rotateRefreshToken(
  oldTokenId: string,
  userId: string,
  metadata?: TokenMetadata
): Promise<string> {
  // Create new token
  const newToken = generateRefreshToken();
  const hashedToken = await hashToken(newToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);
  const newTokenId = generateId();

  await client.query(
    `INSERT INTO refresh_tokens 
     (id, user_id, token, expires_at, ip_address, user_agent) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [newTokenId, userId, hashedToken, expiresAt, metadata?.ipAddress, metadata?.userAgent]
  );

  // Revoke old token
  await client.query(
    `UPDATE refresh_tokens 
     SET revoked = TRUE, 
         revoked_at = NOW(), 
         revoked_reason = 'rotated',
         replaced_by_token = $1
     WHERE id = $2`,
    [newTokenId, oldTokenId]
  );

  return newToken;
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(
  token: string,
  reason: string = 'manual_revocation'
): Promise<boolean> {
  try {
    const result = await client.query(
      'SELECT id, token FROM refresh_tokens WHERE revoked = FALSE'
    );

    for (const row of result.rows) {
      const isMatch = await verifyToken(token, row.token);
      
      if (isMatch) {
        await client.query(
          `UPDATE refresh_tokens 
           SET revoked = TRUE, 
               revoked_at = NOW(), 
               revoked_reason = $1
           WHERE id = $2`,
          [reason, row.id]
        );
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error revoking refresh token:', error);
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(
  userId: string,
  reason: string = 'manual_revocation'
): Promise<number> {
  try {
    const result = await client.query(
      `UPDATE refresh_tokens 
       SET revoked = TRUE, 
           revoked_at = NOW(), 
           revoked_reason = $1
       WHERE user_id = $2 
       AND revoked = FALSE
       RETURNING id`,
      [reason, userId]
    );

    return result.rowCount || 0;
  } catch (error) {
    console.error('Error revoking all user tokens:', error);
    return 0;
  }
}

/**
 * Get all active refresh tokens for a user
 */
export async function getUserActiveTokens(userId: string): Promise<any[]> {
  const result = await client.query(
    `SELECT id, created_at, last_used_at, ip_address, user_agent, expires_at
     FROM refresh_tokens 
     WHERE user_id = $1 
     AND revoked = FALSE 
     AND expires_at > NOW()
     ORDER BY last_used_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Clean up expired tokens (can be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await client.query(
      `DELETE FROM refresh_tokens 
       WHERE expires_at < NOW() - INTERVAL '7 days'
       RETURNING id`
    );

    return result.rowCount || 0;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
}

/**
 * Add JWT to blacklist (for immediate access token revocation)
 */
export async function blacklistAccessToken(
  jti: string,
  userId: string,
  expiresAt: Date,
  reason: string = 'manual_revocation'
): Promise<void> {
  await client.query(
    `INSERT INTO token_blacklist (id, token_jti, user_id, expires_at, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [generateId(), jti, userId, expiresAt, reason]
  );
}

/**
 * Check if access token (JWT) is blacklisted
 */
export async function isAccessTokenBlacklisted(jti: string): Promise<boolean> {
  const result = await client.query(
    'SELECT id FROM token_blacklist WHERE token_jti = $1 AND expires_at > NOW()',
    [jti]
  );

  return result.rows.length > 0;
}

/**
 * Clean up expired blacklist entries
 */
export async function cleanupExpiredBlacklist(): Promise<number> {
  try {
    const result = await client.query(
      'DELETE FROM token_blacklist WHERE expires_at < NOW() RETURNING id'
    );

    return result.rowCount || 0;
  } catch (error) {
    console.error('Error cleaning up blacklist:', error);
    return 0;
  }
}
