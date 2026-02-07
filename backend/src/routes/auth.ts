import express, { Router, Request, Response } from 'express';
import client from '../database/connection.js';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { generateId } from '../utils/id.js';
import { asyncHandler, BadRequestError, UnauthorizedError } from '../middleware/errorHandler.js';
import { registerSchema, loginSchema, validateRequest } from '../utils/validation.js';
import { sanitizeEmail, sanitizePlainText } from '../utils/sanitization.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getUserActiveTokens,
} from '../services/refreshTokenService.js';

const router: Router = express.Router();

// Register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validatedData = validateRequest(registerSchema, req.body);
  
  // Sanitize inputs to prevent XSS
  const email = sanitizeEmail(validatedData.email);
  const name = sanitizePlainText(validatedData.name);
  const password = validatedData.password; // Don't sanitize password, it will be hashed
  const invitationCode = validatedData.invitationCode ? sanitizePlainText(validatedData.invitationCode) : null;

  // Check if invitation code is provided and valid
  let coachId = null;
  if (invitationCode) {
    const invitationResult = await client.query(
      `SELECT coach_id, used, expires_at FROM invitation_codes WHERE code = $1`,
      [invitationCode?.toUpperCase() || '']
    );

    if (invitationResult.rows.length === 0) {
      throw new BadRequestError('Code d\'invitation invalide');
    }

    const invitation = invitationResult.rows[0];

    if (invitation.used) {
      throw new BadRequestError('Ce code a déjà été utilisé');
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      throw new BadRequestError('Ce code d\'invitation a expiré');
    }

    coachId = invitation.coach_id;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = generateId();

  await client.query(
    'INSERT INTO users (id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
    [userId, email, name, hashedPassword, 'athlete']
  );

  // If invitation code was used, create athlete profile and mark code as used
  if (coachId) {
    const athleteId = generateId();
    await client.query(
      `INSERT INTO athletes (id, user_id, coach_id) VALUES ($1, $2, $3)`,
      [athleteId, userId, coachId]
    );

    await client.query(
      `UPDATE invitation_codes SET used = TRUE, used_by = $1 WHERE code = $2`,
      [userId, invitationCode?.toUpperCase() || '']
    );
  }

  const jwtOptions: SignOptions & any = {
    expiresIn: '15m' // Short-lived access token (15 minutes)
  };
  
  const token = jwt.sign(
    { id: userId, role: 'athlete' },
    (process.env.JWT_SECRET || 'secret') as string,
    jwtOptions
  );

  // Create refresh token
  const refreshToken = await createRefreshToken(userId, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({
    user: { id: userId, email, name, role: 'athlete' },
    token,
    refreshToken,
    message: coachId ? 'Compte créé et associé à votre coach' : 'Compte créé avec succès'
  });
}));

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validatedData = validateRequest(loginSchema, req.body);
  
  // Sanitize email (password will be hashed anyway)
  const email = sanitizeEmail(validatedData.email);
  const password = validatedData.password;

  const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const jwtOptions: SignOptions & any = {
    expiresIn: '15m' // Short-lived access token (15 minutes)
  };
  
  const token = jwt.sign(
    { id: user.id, role: user.role },
    (process.env.JWT_SECRET || 'secret') as string,
    jwtOptions
  );

  // Create refresh token
  const refreshToken = await createRefreshToken(user.id, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token,
    refreshToken,
  });
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new BadRequestError('Refresh token required');
  }

  // Verify and rotate refresh token
  const result = await verifyRefreshToken(refreshToken, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  if (!result.valid || !result.userId || !result.newToken) {
    throw new UnauthorizedError(result.error || 'Invalid refresh token');
  }

  // Get user data
  const userResult = await client.query(
    'SELECT id, email, name, role FROM users WHERE id = $1',
    [result.userId]
  );

  if (userResult.rows.length === 0) {
    throw new UnauthorizedError('User not found');
  }

  const user = userResult.rows[0];

  // Generate new access token
  const jwtOptions: SignOptions & any = {
    expiresIn: '15m' // Short-lived access token (15 minutes)
  };

  const newAccessToken = jwt.sign(
    { id: user.id, role: user.role },
    (process.env.JWT_SECRET || 'secret') as string,
    jwtOptions
  );

  res.json({
    token: newAccessToken,
    refreshToken: result.newToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}));

// Logout endpoint (revoke refresh token)
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken, 'user_logout');
  }

  res.json({ message: 'Logged out successfully' });
}));

// Logout all sessions (revoke all user's refresh tokens)
router.post('/logout-all', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const revokedCount = await revokeAllUserTokens(userId, 'logout_all_sessions');

  res.json({
    message: `${revokedCount} session(s) terminated`,
    revokedCount,
  });
}));

// Get active sessions
router.get('/sessions', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const sessions = await getUserActiveTokens(userId);

  res.json({
    sessions: sessions.map(s => ({
      id: s.id,
      createdAt: s.created_at,
      lastUsedAt: s.last_used_at,
      ipAddress: s.ip_address,
      userAgent: s.user_agent,
      expiresAt: s.expires_at,
    })),
    count: sessions.length,
  });
}));

export default router;
