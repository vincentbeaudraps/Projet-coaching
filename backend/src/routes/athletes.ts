import express, { Router } from 'express';
import client from '../database/connection.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router: Router = express.Router();

// Get all athletes for a coach
router.get('/', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const coachId = req.userId;
    
    const result = await client.query(
      `SELECT a.*, u.email, u.name 
       FROM athletes a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.coach_id = $1`,
      [coachId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch athletes error:', error);
    res.status(500).json({ message: 'Failed to fetch athletes' });
  }
});

// Add athlete for coach
router.post('/', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const { userId, age, level, goals } = req.body;
    const coachId = req.userId;

    const result = await client.query(
      `INSERT INTO athletes (user_id, coach_id, age, level, goals) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, coachId, age, level, goals]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add athlete error:', error);
    res.status(500).json({ message: 'Failed to add athlete' });
  }
});

// Get athlete details
router.get('/:athleteId', authenticateToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    const result = await client.query(
      `SELECT a.*, u.email, u.name 
       FROM athletes a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = $1`,
      [athleteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch athlete error:', error);
    res.status(500).json({ message: 'Failed to fetch athlete' });
  }
});

// Update athlete
router.put('/:athleteId', authenticateToken, authenticateToken, async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { age, level, goals } = req.body;

    const result = await client.query(
      `UPDATE athletes SET age = $1, level = $2, goals = $3 
       WHERE id = $4 
       RETURNING *`,
      [age, level, goals, athleteId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update athlete error:', error);
    res.status(500).json({ message: 'Failed to update athlete' });
  }
});

export default router;
