import express, { Router, Request, Response } from 'express';
import client from '../database/connection.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { generateId } from '../utils/id.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

// Generate invitation code (Coach only)
router.post('/generate', authenticateToken, authorizeRole('coach'), asyncHandler(async (req: Request, res: Response) => {
  const coachId = req.userId!;
  
  // Generate unique code (format: COACH-XXXXXX)
  const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `COACH-${randomCode}`;
  const invitationId = generateId();
  
  // Set expiration to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const result = await client.query(
    `INSERT INTO invitation_codes (id, code, coach_id, expires_at) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [invitationId, code, coachId, expiresAt]
  );

  res.status(201).json({
    code: result.rows[0].code,
    expiresAt: result.rows[0].expires_at,
    message: 'Code d\'invitation généré avec succès'
  });
}));

// Get all invitation codes for a coach
router.get('/my-codes', authenticateToken, authorizeRole('coach'), asyncHandler(async (req: Request, res: Response) => {
  const coachId = req.userId!;

  const result = await client.query(
    `SELECT ic.*, u.name as used_by_name, u.email as used_by_email
     FROM invitation_codes ic
     LEFT JOIN users u ON ic.used_by = u.id
     WHERE ic.coach_id = $1
     ORDER BY ic.created_at DESC`,
    [coachId]
  );

  res.json(result.rows);
}));

// Validate invitation code (Public - used during registration)
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    throw new BadRequestError('Code d\'invitation requis');
  }

  const result = await client.query(
    `SELECT ic.*, u.name as coach_name, u.email as coach_email
     FROM invitation_codes ic
     JOIN users u ON ic.coach_id = u.id
     WHERE ic.code = $1`,
    [code.toUpperCase()]
  );

  if (!result.rows[0]) throw new NotFoundError('Code d\'invitation invalide');

  const invitation = result.rows[0];

  // Check if already used
  if (invitation.used) {
    throw new BadRequestError('Ce code a déjà été utilisé');
  }

  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    throw new BadRequestError('Ce code d\'invitation a expiré');
  }

  res.json({
    valid: true,
    coachName: invitation.coach_name,
    coachId: invitation.coach_id,
    message: `Vous serez entraîné par ${invitation.coach_name}`
  });
}));

// Mark invitation code as used (called during registration)
router.post('/use', asyncHandler(async (req: Request, res: Response) => {
  const { code, userId } = req.body;

  await client.query(
    `UPDATE invitation_codes 
     SET used = TRUE, used_by = $1 
     WHERE code = $2`,
    [userId, code.toUpperCase()]
  );

  res.json({ message: 'Invitation code marked as used' });
}));

// Delete invitation code
router.delete('/:code', authenticateToken, authorizeRole('coach'), asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const coachId = req.userId!;

  const result = await client.query(
    `DELETE FROM invitation_codes 
     WHERE code = $1 AND coach_id = $2
     RETURNING *`,
    [code, coachId]
  );

  if (!result.rows[0]) throw new NotFoundError('Code not found or unauthorized');

  res.json({ message: 'Invitation code deleted' });
}));

export default router;
