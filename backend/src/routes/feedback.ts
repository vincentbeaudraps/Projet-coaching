import { Router, Request, Response } from 'express';
import client from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { createNotification } from './notifications.js';
import { generateId } from '../utils/id.js';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler.js';
import { athleteService } from '../services/athleteService.js';
import { createFeedbackSchema, updateFeedbackSchema, validateRequest } from '../utils/validation.js';

const router = Router();

/**
 * POST /api/feedback
 * Create session feedback (athlete submits after completing session)
 */
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const athleteId = req.userId!;
  const validatedData = validateRequest(createFeedbackSchema, req.body);
  const {
    sessionId, feelingRating, difficultyRating, fatigueRating,
    athleteNotes, completedDistance, completedDuration, avgHeartRate, avgPace
  } = validatedData;

  // Verify session belongs to athlete
  const sessionResult = await client.query(
    'SELECT athlete_id, title FROM training_sessions WHERE id = $1',
    [sessionId]
  );

  if (!sessionResult.rows[0]) throw new NotFoundError('Session not found');

  if (sessionResult.rows[0].athlete_id !== athleteId) {
    throw new ForbiddenError('Not authorized to submit feedback for this session');
  }

  const sessionTitle = sessionResult.rows[0].title;

  // Check if feedback already exists
  const existingFeedback = await client.query(
    'SELECT id FROM session_feedback WHERE session_id = $1 AND athlete_id = $2',
    [sessionId, athleteId]
  );

  const feedbackId = existingFeedback.rows.length > 0 
    ? existingFeedback.rows[0].id 
    : generateId();

  let result;

  if (existingFeedback.rows.length > 0) {
    // Update existing feedback
    result = await client.query(
      `UPDATE session_feedback 
       SET feeling_rating = $1, difficulty_rating = $2, fatigue_rating = $3,
           athlete_notes = $4, completed_distance = $5, completed_duration = $6,
           avg_heart_rate = $7, avg_pace = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        feelingRating, difficultyRating, fatigueRating,
        athleteNotes, completedDistance, completedDuration,
        avgHeartRate, avgPace, feedbackId
      ]
    );
  } else {
    // Insert new feedback
    result = await client.query(
      `INSERT INTO session_feedback (
        id, session_id, athlete_id, feeling_rating, difficulty_rating, fatigue_rating,
        athlete_notes, completed_distance, completed_duration, avg_heart_rate, avg_pace
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        feedbackId, sessionId, athleteId, feelingRating, difficultyRating, fatigueRating,
        athleteNotes, completedDistance, completedDuration, avgHeartRate, avgPace
      ]
    );
  }

  // Get coach ID and athlete name
  const coachResult = await client.query(
    `SELECT ts.coach_id, u.name as athlete_name
     FROM training_sessions ts
     JOIN users u ON u.id = ts.athlete_id
     WHERE ts.id = $1`,
    [sessionId]
  );

  if (coachResult.rows[0]) {
    const { coach_id: coachId, athlete_name: athleteName } = coachResult.rows[0];

    // Notify coach about new feedback
    await createNotification(
      coachId,
      'feedback_received',
      '💬 Nouveau feedback reçu',
      `${athleteName} a complété la séance "${sessionTitle}" et ajouté un retour`,
      `/dashboard`,
      feedbackId
    );
  }

  res.status(existingFeedback.rows.length > 0 ? 200 : 201).json({
    message: existingFeedback.rows.length > 0 
      ? 'Feedback updated successfully' 
      : 'Feedback created successfully',
    feedback: result.rows[0]
  });
}));

/**
 * GET /api/feedback/session/:sessionId
 * Get feedback for a specific session
 */
router.get('/session/:sessionId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const userId = req.userId!;

  // Verify user has access to this session
  const sessionResult = await client.query(
    'SELECT athlete_id, coach_id FROM training_sessions WHERE id = $1',
    [sessionId]
  );

  if (!sessionResult.rows[0]) throw new NotFoundError('Session not found');

  const { athlete_id, coach_id } = sessionResult.rows[0];

  if (userId !== athlete_id && userId !== coach_id) {
    throw new ForbiddenError('Not authorized to view this feedback');
  }

  const result = await client.query(
    `SELECT sf.*, u.name as athlete_name
     FROM session_feedback sf
     JOIN users u ON u.id = sf.athlete_id
     WHERE sf.session_id = $1`,
    [sessionId]
  );

  if (!result.rows[0]) throw new NotFoundError('Feedback not found');

  res.json(result.rows[0]);
}));

/**
 * GET /api/feedback/athlete/:athleteId
 * Get all feedback for an athlete (coach or athlete view)
 */
router.get('/athlete/:athleteId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const userId = req.userId!;

  // Verify access using athleteService
  await athleteService.verifyAccess(athleteId, userId, req.userRole!);

  const result = await client.query(
    `SELECT sf.*, ts.title as session_title, ts.start_date
     FROM session_feedback sf
     JOIN training_sessions ts ON ts.id = sf.session_id
     WHERE sf.athlete_id = $1
     ORDER BY sf.created_at DESC`,
    [athleteId]
  );

  res.json(result.rows);
}));

/**
 * PATCH /api/feedback/:id/coach-comment
 * Add/update coach comment on feedback
 */
router.patch('/:id/coach-comment', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { coachComment } = req.body;
  const coachId = req.userId!;

  if (!coachComment) throw new BadRequestError('Coach comment is required');

  // Verify coach owns this feedback's session
  const feedbackResult = await client.query(
    `SELECT sf.session_id, ts.coach_id, ts.athlete_id, ts.title, u.name as athlete_name
     FROM session_feedback sf
     JOIN training_sessions ts ON ts.id = sf.session_id
     JOIN users u ON u.id = ts.athlete_id
     WHERE sf.id = $1`,
    [id]
  );

  if (!feedbackResult.rows[0]) throw new NotFoundError('Feedback not found');

  if (feedbackResult.rows[0].coach_id !== coachId) {
    throw new ForbiddenError('Not authorized to comment on this feedback');
  }

  const { athlete_id: athleteId, title: sessionTitle } = feedbackResult.rows[0];

  // Update feedback with coach comment
  const result = await client.query(
    `UPDATE session_feedback 
     SET coach_comment = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [coachComment, id]
  );

  // Notify athlete about coach comment
  await createNotification(
    athleteId,
    'feedback_received',
    '💬 Commentaire du coach',
    `Ton coach a répondu à ton feedback sur "${sessionTitle}"`,
    `/dashboard`,
    id
  );

  res.json({
    message: 'Coach comment added successfully',
    feedback: result.rows[0]
  });
}));

/**
 * DELETE /api/feedback/:id
 * Delete feedback (athlete only, before coach has seen it)
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  // Verify user owns this feedback and coach hasn't commented
  const feedbackResult = await client.query(
    'SELECT athlete_id, coach_comment FROM session_feedback WHERE id = $1',
    [id]
  );

  if (!feedbackResult.rows[0]) throw new NotFoundError('Feedback not found');

  if (feedbackResult.rows[0].athlete_id !== userId) {
    throw new ForbiddenError('Not authorized to delete this feedback');
  }

  if (feedbackResult.rows[0].coach_comment) {
    throw new BadRequestError('Cannot delete feedback after coach has commented');
  }

  await client.query('DELETE FROM session_feedback WHERE id = $1', [id]);
  res.json({ message: 'Feedback deleted successfully' });
}));

/**
 * GET /api/feedback/stats/athlete/:athleteId
 * Get feedback statistics for an athlete
 */
router.get('/stats/athlete/:athleteId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const userId = req.userId!;

  // Verify access
  await athleteService.verifyAccess(athleteId, userId, req.userRole!);

  const result = await client.query(
    `SELECT 
      COUNT(*) as total_feedback,
      ROUND(AVG(feeling_rating)::numeric, 1) as avg_feeling,
      ROUND(AVG(difficulty_rating)::numeric, 1) as avg_difficulty,
      ROUND(AVG(fatigue_rating)::numeric, 1) as avg_fatigue,
      COUNT(CASE WHEN coach_comment IS NOT NULL THEN 1 END) as with_coach_response
     FROM session_feedback
     WHERE athlete_id = $1`,
    [athleteId]
  );

  res.json(result.rows[0]);
}));

export default router;
