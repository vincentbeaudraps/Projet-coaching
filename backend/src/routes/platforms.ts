import express, { Router } from 'express';
import axios from 'axios';
import client from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { PLATFORM_CONFIGS, Platform, SUPPORTED_PLATFORMS } from '../config/platforms.js';
import { generateId } from '../utils/id.js';

const router: Router = express.Router();

// Get athlete's connected platforms
router.get('/connected', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Get athlete ID from user ID
    const athleteResult = await client.query(
      'SELECT id FROM athletes WHERE user_id = $1',
      [userId]
    );

    if (athleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    const athleteId = athleteResult.rows[0].id;

    // Get all connected platforms
    const result = await client.query(
      `SELECT id, platform, athlete_platform_id, connected_at, last_sync_at, is_active, metadata
       FROM connected_platforms 
       WHERE athlete_id = $1 
       ORDER BY connected_at DESC`,
      [athleteId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get connected platforms error:', error);
    res.status(500).json({ message: 'Failed to get connected platforms' });
  }
});

// Get OAuth authorization URL
router.get('/oauth/:platform/authorize', authenticateToken, async (req, res) => {
  try {
    const platform = req.params.platform as Platform;

    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      return res.status(400).json({ message: 'Unsupported platform' });
    }

    const config = PLATFORM_CONFIGS[platform];
    const state = generateId(); // Pour sécurité CSRF

    // Store state in session or database temporarily
    // Pour simplifier, on le renvoie au client qui le renverra au callback
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: Array.isArray(config.scopes) ? config.scopes.join(',') : config.scopes,
      state,
    });

    const authUrl = `${config.authUrl}?${params.toString()}`;

    res.json({ authUrl, state });
  } catch (error) {
    console.error('OAuth authorize error:', error);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

// OAuth callback handler
router.post('/oauth/:platform/callback', authenticateToken, async (req, res) => {
  try {
    const platform = req.params.platform as Platform;
    const { code, state } = req.body;
    const userId = req.userId;

    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      return res.status(400).json({ message: 'Unsupported platform' });
    }

    // Get athlete ID
    const athleteResult = await client.query(
      'SELECT id FROM athletes WHERE user_id = $1',
      [userId]
    );

    if (athleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    const athleteId = athleteResult.rows[0].id;
    const config = PLATFORM_CONFIGS[platform];

    // Exchange code for access token
    const tokenData = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    });

    const tokenResponse = await axios.post(config.tokenUrl, tokenData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const {
      access_token,
      refresh_token,
      expires_in,
      athlete: platformAthlete, // Strava returns athlete info
    } = tokenResponse.data;

    // Calculate token expiration
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : null;

    // Get athlete info from platform if available
    let athletePlatformId = platformAthlete?.id?.toString() || null;
    let metadata: any = {};

    if (platform === 'strava' && platformAthlete) {
      athletePlatformId = platformAthlete.id.toString();
      metadata = {
        username: platformAthlete.username,
        firstname: platformAthlete.firstname,
        lastname: platformAthlete.lastname,
        profile: platformAthlete.profile,
      };
    }

    // Try to fetch user info for other platforms
    if (!athletePlatformId && access_token) {
      try {
        const userInfoResponse = await axios.get(`${config.apiBaseUrl}/user`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        athletePlatformId = userInfoResponse.data.id?.toString();
        metadata = userInfoResponse.data;
      } catch (e) {
        console.log('Could not fetch user info from platform:', e);
      }
    }

    // Store connection in database
    await client.query(
      `INSERT INTO connected_platforms 
       (athlete_id, platform, access_token, refresh_token, token_expires_at, scope, athlete_platform_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (athlete_id, platform) 
       DO UPDATE SET 
         access_token = $3,
         refresh_token = $4,
         token_expires_at = $5,
         scope = $6,
         athlete_platform_id = $7,
         metadata = $8,
         is_active = true,
         updated_at = NOW()`,
      [
        athleteId,
        platform,
        access_token,
        refresh_token,
        expiresAt,
        Array.isArray(config.scopes) ? config.scopes.join(',') : config.scopes,
        athletePlatformId,
        JSON.stringify(metadata),
      ]
    );

    res.json({
      message: 'Platform connected successfully',
      platform,
      athletePlatformId,
    });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to connect platform',
      error: error.response?.data || error.message,
    });
  }
});

// Disconnect platform
router.delete('/disconnect/:platform', authenticateToken, async (req, res) => {
  try {
    const platform = req.params.platform as Platform;
    const userId = req.userId;

    // Get athlete ID
    const athleteResult = await client.query(
      'SELECT id FROM athletes WHERE user_id = $1',
      [userId]
    );

    if (athleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    const athleteId = athleteResult.rows[0].id;

    // Deactivate connection
    await client.query(
      `UPDATE connected_platforms 
       SET is_active = false, updated_at = NOW()
       WHERE athlete_id = $1 AND platform = $2`,
      [athleteId, platform]
    );

    res.json({ message: 'Platform disconnected successfully' });
  } catch (error) {
    console.error('Disconnect platform error:', error);
    res.status(500).json({ message: 'Failed to disconnect platform' });
  }
});

// Refresh access token
async function refreshAccessToken(platform: Platform, refreshToken: string): Promise<any> {
  const config = PLATFORM_CONFIGS[platform];

  const tokenData = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await axios.post(config.tokenUrl, tokenData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return response.data;
}

// Manual sync trigger
router.post('/sync/:platform', authenticateToken, async (req, res) => {
  try {
    const platform = req.params.platform as Platform;
    const userId = req.userId;

    // Get athlete ID
    const athleteResult = await client.query(
      'SELECT id FROM athletes WHERE user_id = $1',
      [userId]
    );

    if (athleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    const athleteId = athleteResult.rows[0].id;

    // Get platform connection
    const connectionResult = await client.query(
      `SELECT * FROM connected_platforms 
       WHERE athlete_id = $1 AND platform = $2 AND is_active = true`,
      [athleteId, platform]
    );

    if (connectionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Platform not connected' });
    }

    const connection = connectionResult.rows[0];

    // Check if token needs refresh
    let accessToken = connection.access_token;
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      if (!connection.refresh_token) {
        return res.status(401).json({ message: 'Token expired, please reconnect' });
      }

      const newTokens = await refreshAccessToken(platform, connection.refresh_token);
      accessToken = newTokens.access_token;

      // Update tokens in database
      await client.query(
        `UPDATE connected_platforms 
         SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = NOW()
         WHERE id = $4`,
        [
          newTokens.access_token,
          newTokens.refresh_token,
          new Date(Date.now() + newTokens.expires_in * 1000),
          connection.id,
        ]
      );
    }

    // TODO: Implement actual sync logic here
    // For now, just log the sync attempt
    const syncLogId = generateId();
    await client.query(
      `INSERT INTO sync_logs (id, connection_id, sync_type, status, items_synced, sync_completed_at)
       VALUES ($1, $2, 'manual_sync', 'success', 0, NOW())`,
      [syncLogId, connection.id]
    );

    // Update last sync time
    await client.query(
      `UPDATE connected_platforms SET last_sync_at = NOW() WHERE id = $1`,
      [connection.id]
    );

    res.json({ message: 'Sync completed successfully', syncLogId });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Sync failed', error: error.message });
  }
});

// Get sync history
router.get('/sync-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Get athlete ID
    const athleteResult = await client.query(
      'SELECT id FROM athletes WHERE user_id = $1',
      [userId]
    );

    if (athleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    const athleteId = athleteResult.rows[0].id;

    // Get sync logs
    const result = await client.query(
      `SELECT sl.*, cp.platform 
       FROM sync_logs sl
       JOIN connected_platforms cp ON sl.connection_id = cp.id
       WHERE cp.athlete_id = $1
       ORDER BY sl.created_at DESC
       LIMIT 50`,
      [athleteId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get sync history error:', error);
    res.status(500).json({ message: 'Failed to get sync history' });
  }
});

export default router;
