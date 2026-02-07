import express, { Router, Request, Response } from 'express';
import client from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, BadRequestError } from '../middleware/errorHandler.js';
import { recordPerformanceSchema, validateRequest } from '../utils/validation.js';

const router: Router = express.Router();

// Record performance
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validateRequest(recordPerformanceSchema, req.body);
  const { athleteId, sessionId, actualDistance, actualDuration, avgHeartRate, maxHeartRate, notes } = validatedData;

  const result = await client.query(
    `INSERT INTO performance_records 
     (athlete_id, session_id, actual_distance, actual_duration, avg_heart_rate, max_heart_rate, notes, recorded_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
     RETURNING *`,
    [athleteId, sessionId, actualDistance, actualDuration, avgHeartRate, maxHeartRate, notes]
  );

  res.status(201).json(result.rows[0]);
}));

// Get athlete performance history
router.get('/athlete/:athleteId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;

  const result = await client.query(
    `SELECT * FROM performance_records 
     WHERE athlete_id = $1 
     ORDER BY recorded_at DESC`,
    [athleteId]
  );

  res.json(result.rows);
}));

// Get performance analytics
router.get('/analytics/:athleteId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;

  const result = await client.query(
    `SELECT 
      COUNT(*) as total_sessions,
      AVG(actual_distance) as avg_distance,
      AVG(actual_duration) as avg_duration,
      AVG(avg_heart_rate) as avg_heart_rate,
      MAX(actual_distance) as max_distance,
      SUM(actual_distance) as total_distance
     FROM performance_records 
     WHERE athlete_id = $1`,
    [athleteId]
  );

  res.json(result.rows[0]);
}));

export default router;
