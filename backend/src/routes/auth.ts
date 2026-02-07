import express, { Router, Request, Response } from 'express';
import client from '../database/connection.js';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { generateId } from '../utils/id.js';
import { asyncHandler, BadRequestError, UnauthorizedError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

// Register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password, invitationCode } = req.body;

  if (!email || !name || !password) {
    throw new BadRequestError('Missing required fields');
  }

  // Check if invitation code is provided and valid
  let coachId = null;
  if (invitationCode) {
    const invitationResult = await client.query(
      `SELECT coach_id, used, expires_at FROM invitation_codes WHERE code = $1`,
      [invitationCode.toUpperCase()]
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
      [userId, invitationCode.toUpperCase()]
    );
  }

  const jwtOptions: SignOptions & any = {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  };
  
  const token = jwt.sign(
    { id: userId, role: 'athlete' },
    (process.env.JWT_SECRET || 'secret') as string,
    jwtOptions
  );

  res.status(201).json({
    user: { id: userId, email, name, role: 'athlete' },
    token,
    message: coachId ? 'Compte créé et associé à votre coach' : 'Compte créé avec succès'
  });
}));

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

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
    expiresIn: process.env.JWT_EXPIRE || '7d'
  };
  
  const token = jwt.sign(
    { id: user.id, role: user.role },
    (process.env.JWT_SECRET || 'secret') as string,
    jwtOptions
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  });
}));

export default router;
