import express, { Router } from 'express';
import client from '../database/connection.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router: Router = express.Router();

// Create training session
router.post('/', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const { athleteId, title, description, type, distance, duration, intensity, startDate } = req.body;
    const coachId = req.userId;

    const result = await client.query(
      `INSERT INTO training_sessions 
       (coach_id, athlete_id, title, description, type, distance, duration, intensity, start_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [coachId, athleteId, title, description, type, distance, duration, intensity, startDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Failed to create session' });
  }
});

// Get sessions for athlete
router.get('/athlete/:athleteId', authenticateToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    const result = await client.query(
      `SELECT * FROM training_sessions 
       WHERE athlete_id = $1 
       ORDER BY start_date DESC`,
      [athleteId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

// Get all sessions for coach
router.get('/', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const coachId = req.userId;

    const result = await client.query(
      `SELECT * FROM training_sessions 
       WHERE coach_id = $1 
       ORDER BY start_date DESC`,
      [coachId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

// Update session
router.put('/:sessionId', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, description, type, distance, duration, intensity, startDate } = req.body;

    const result = await client.query(
      `UPDATE training_sessions 
       SET title = $1, description = $2, type = $3, distance = $4, duration = $5, intensity = $6, start_date = $7 
       WHERE id = $8 
       RETURNING *`,
      [title, description, type, distance, duration, intensity, startDate, sessionId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ message: 'Failed to update session' });
  }
});

// Delete session
router.delete('/:sessionId', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const { sessionId } = req.params;

    await client.query('DELETE FROM training_sessions WHERE id = $1', [sessionId]);

    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

export default router;
