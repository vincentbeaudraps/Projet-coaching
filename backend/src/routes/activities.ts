import express, { Router } from 'express';
import client from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId } from '../utils/id.js';
import multer from 'multer';
import { parseGPX } from '../utils/gpxParser.js';

const router: Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all activities for an athlete
router.get('/athlete/:athleteId', authenticateToken, async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { startDate, endDate } = req.query;

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
  } catch (error) {
    console.error('Fetch activities error:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});

// Get all activities for coach (all athletes)
router.get('/coach/all', authenticateToken, async (req, res) => {
  try {
    const coachId = req.userId;
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
  } catch (error) {
    console.error('Fetch coach activities error:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});

// Create activity manually
router.post('/', authenticateToken, async (req, res) => {
  try {
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
    } = req.body;

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
  } catch (error: any) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: 'Failed to create activity', error: error.message });
  }
});

// Upload GPX file
router.post('/upload-gpx', authenticateToken, upload.single('gpxFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { athleteId } = req.body;
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
  } catch (error: any) {
    console.error('Upload GPX error:', error);
    res.status(500).json({ message: 'Failed to upload GPX', error: error.message });
  }
});

// Update activity
router.put('/:activityId', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { 
      title, 
      activity_type,
      duration,
      distance,
      difficulty_rating, 
      feeling_rating, 
      athlete_notes 
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (activity_type !== undefined) {
      updates.push(`activity_type = $${paramIndex++}`);
      values.push(activity_type);
    }
    if (duration !== undefined) {
      updates.push(`duration = $${paramIndex++}`);
      values.push(duration);
    }
    if (distance !== undefined) {
      updates.push(`distance = $${paramIndex++}`);
      values.push(distance);
    }
    if (difficulty_rating !== undefined) {
      updates.push(`difficulty_rating = $${paramIndex++}`);
      values.push(difficulty_rating);
    }
    if (feeling_rating !== undefined) {
      updates.push(`feeling_rating = $${paramIndex++}`);
      values.push(feeling_rating);
    }
    if (athlete_notes !== undefined) {
      updates.push(`athlete_notes = $${paramIndex++}`);
      values.push(athlete_notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
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
  } catch (error: any) {
    console.error('Update activity error:', error);
    res.status(500).json({ message: 'Failed to update activity', error: error.message });
  }
});

// Delete activity
router.delete('/:activityId', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;

    await client.query('DELETE FROM completed_activities WHERE id = $1', [activityId]);

    res.json({ message: 'Activity deleted' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Failed to delete activity' });
  }
});

export default router;
