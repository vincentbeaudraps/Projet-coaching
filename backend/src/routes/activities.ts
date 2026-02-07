import express, { Router, Request, Response } from 'express';
import client from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId } from '../utils/id.js';
import multer from 'multer';
import { parseGPX } from '../utils/gpxParser.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import { athleteService } from '../services/athleteService.js';
import { createCompletedActivitySchema, updateCompletedActivitySchema, validateRequest } from '../utils/validation.js';

const router: Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all activities for an athlete
router.get('/athlete/:athleteId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const { startDate, endDate } = req.query;
  const userId = req.userId!;
  const userRole = req.userRole!;

  // Verify access
  await athleteService.verifyAccess(athleteId, userId, userRole);

  let query = `
    SELECT * FROM completed_activities 
    WHERE athlete_id = $1
  `;
  const params: any[] = [athleteId];

  if (startDate && endDate) {
    query += ` AND start_date >= $2 AND start_date <= $3`;
    params.push(startDate, endDate);
  }

  query += ` ORDER BY start_date DESC`;

  const result = await client.query(query, params);
  res.json(result.rows);
}));

// Get all activities for coach (all athletes)
router.get('/coach/all', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const coachId = req.userId!;
  const { startDate, endDate } = req.query;

  let query = `
    SELECT ca.*, a.id as athlete_id, u.name as athlete_name
    FROM completed_activities ca
    JOIN athletes a ON ca.athlete_id = a.id
    JOIN users u ON a.user_id = u.id
    WHERE a.coach_id = $1
  `;
  const params: any[] = [coachId];

  if (startDate && endDate) {
    query += ` AND ca.start_date >= $2 AND ca.start_date <= $3`;
    params.push(startDate, endDate);
  }

  query += ` ORDER BY ca.start_date DESC`;

  const result = await client.query(query, params);
  res.json(result.rows);
}));

// Create activity manually
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validateRequest(createCompletedActivitySchema, req.body);
  const {
    athleteId,
    activityType,
    title,
    startDate,
    duration,
    distance,
    elevationGain,
    avgHeartRate,
    maxHeartRate,
    avgPace,
    avgSpeed,
    calories,
    notes,
  } = validatedData;

  const activityId = generateId();

  await client.query(
    `INSERT INTO completed_activities 
     (id, athlete_id, activity_type, title, start_date, duration, distance, 
      elevation_gain, avg_heart_rate, max_heart_rate, avg_pace, avg_speed, 
      calories, source, notes) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      activityId,
      athleteId,
      activityType,
      title,
      startDate,
      duration,
        distance,
        elevationGain,
        avgHeartRate,
        maxHeartRate,
        avgPace,
        avgSpeed,
        calories,
        'manual',
        notes,
      ]
    );

    const result = await client.query(
      'SELECT * FROM completed_activities WHERE id = $1',
      [activityId]
    );

    res.status(201).json(result.rows[0]);
}));

// Upload GPX file
router.post('/upload-gpx', authenticateToken, upload.single('gpxFile'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('No file uploaded');
  }

  const { athleteId } = req.body;
  
  if (!athleteId) {
    throw new BadRequestError('athleteId is required');
  }

  const gpxContent = req.file.buffer.toString('utf-8');
  
  // Parse GPX file
  const activityData = await parseGPX(gpxContent);

  const activityId = generateId();

  await client.query(
    `INSERT INTO completed_activities 
     (id, athlete_id, activity_type, title, start_date, duration, distance, 
      elevation_gain, avg_heart_rate, max_heart_rate, avg_pace, avg_speed, 
      calories, source, gpx_data) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      activityId,
      athleteId,
      activityData.activityType || 'running',
      activityData.title || 'Imported Activity',
      activityData.startDate,
      activityData.duration,
      activityData.distance,
      activityData.elevationGain,
      activityData.avgHeartRate,
      activityData.maxHeartRate,
      activityData.avgPace,
      activityData.avgSpeed,
      activityData.calories,
      'gpx',
      gpxContent,
    ]
  );

  const result = await client.query(
    'SELECT * FROM completed_activities WHERE id = $1',
    [activityId]
  );

  res.status(201).json(result.rows[0]);
}));

// Update activity
router.put('/:activityId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { activityId } = req.params;
  const validatedData = validateRequest(updateCompletedActivitySchema, req.body);
  const { 
    title, 
    duration,
    distance,
    elevationGain,
    avgHeartRate,
    maxHeartRate,
    avgPace,
    avgSpeed,
    calories,
    notes
  } = validatedData;

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (duration !== undefined) {
    updates.push(`duration = $${paramIndex++}`);
    values.push(duration);
  }
  if (distance !== undefined) {
    updates.push(`distance = $${paramIndex++}`);
    values.push(distance);
  }
  if (elevationGain !== undefined) {
    updates.push(`elevation_gain = $${paramIndex++}`);
    values.push(elevationGain);
  }
  if (avgHeartRate !== undefined) {
    updates.push(`avg_heart_rate = $${paramIndex++}`);
    values.push(avgHeartRate);
  }
  if (maxHeartRate !== undefined) {
    updates.push(`max_heart_rate = $${paramIndex++}`);
    values.push(maxHeartRate);
  }
  if (avgPace !== undefined) {
    updates.push(`avg_pace = $${paramIndex++}`);
    values.push(avgPace);
  }
  if (avgSpeed !== undefined) {
    updates.push(`avg_speed = $${paramIndex++}`);
    values.push(avgSpeed);
  }
  if (calories !== undefined) {
    updates.push(`calories = $${paramIndex++}`);
    values.push(calories);
  }
  if (notes !== undefined) {
    updates.push(`notes = $${paramIndex++}`);
    values.push(notes);
  }

  if (updates.length === 0) {
    throw new BadRequestError('No fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(activityId);

  await client.query(
    `UPDATE completed_activities 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex}`,
    values
  );

  const result = await client.query(
    'SELECT * FROM completed_activities WHERE id = $1',
    [activityId]
  );

  res.json(result.rows[0]);
}));

// Delete activity
router.delete('/:activityId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { activityId } = req.params;

  await client.query('DELETE FROM completed_activities WHERE id = $1', [activityId]);

  res.json({ message: 'Activity deleted' });
}));

export default router;
