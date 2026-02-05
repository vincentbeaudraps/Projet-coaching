import express, { Router } from 'express';
import client from '../database/connection.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { generateId } from '../utils/id.js';

const router: Router = express.Router();

// Get current athlete profile (for authenticated athlete)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await client.query(
      `SELECT a.*, u.email as user_email, u.name as user_name 
       FROM athletes a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch athlete profile error:', error);
    res.status(500).json({ message: 'Failed to fetch athlete profile' });
  }
});

// Get all athletes for a coach
router.get('/', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const coachId = req.userId;
    
    const result = await client.query(
      `SELECT a.*, u.email as user_email, u.name as user_name 
       FROM athletes a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.coach_id = $1
       ORDER BY a.created_at DESC`,
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
      `SELECT a.*, u.email as user_email, u.name as user_name 
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

// Create athlete account (creates user + athlete profile)
router.post('/create-account', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const { email, name, age, level, goals } = req.body;
    const coachId = req.userId;

    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required' });
    }

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const userId = generateId();

    // Create user account
    await client.query(
      'INSERT INTO users (id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
      [userId, email, name, hashedPassword, 'athlete']
    );

    // Create athlete profile
    const athleteId = generateId();
    const result = await client.query(
      `INSERT INTO athletes (id, user_id, coach_id, age, level, goals) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [athleteId, userId, coachId, age, level, goals]
    );

    // TODO: Send email with temporary password
    console.log(`Temporary password for ${email}: ${tempPassword}`);

    res.status(201).json({
      athlete: result.rows[0],
      message: 'Athlète créé avec succès',
      tempPassword // In production, this should be sent via email
    });
  } catch (error) {
    console.error('Create athlete account error:', error);
    res.status(500).json({ message: 'Failed to create athlete account' });
  }
});

// Delete athlete
router.delete('/:athleteId', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const { athleteId } = req.params;
    const coachId = req.userId;

    // Verify that this athlete belongs to this coach
    const athleteCheck = await client.query(
      'SELECT user_id FROM athletes WHERE id = $1 AND coach_id = $2',
      [athleteId, coachId]
    );

    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found or unauthorized' });
    }

    const userId = athleteCheck.rows[0].user_id;

    // Delete athlete (will cascade delete sessions and performances)
    await client.query('DELETE FROM athletes WHERE id = $1', [athleteId]);
    
    // Delete user account
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Athlete deleted successfully' });
  } catch (error) {
    console.error('Delete athlete error:', error);
    res.status(500).json({ message: 'Failed to delete athlete' });
  }
});

// Update athlete metrics
router.put('/:athleteId/metrics', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const { athleteId } = req.params;
    const coachId = req.userId;
    const {
      max_heart_rate,
      vma,
      resting_heart_rate,
      weight,
      vo2max,
      lactate_threshold_pace,
      notes
    } = req.body;

    // Verify that this athlete belongs to this coach
    const athleteCheck = await client.query(
      'SELECT id FROM athletes WHERE id = $1 AND coach_id = $2',
      [athleteId, coachId]
    );

    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found or unauthorized' });
    }

    // Update athlete metrics
    const result = await client.query(
      `UPDATE athletes 
       SET max_heart_rate = $1,
           vma = $2,
           resting_heart_rate = $3,
           weight = $4,
           vo2max = $5,
           lactate_threshold_pace = $6,
           metrics_updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        max_heart_rate || null,
        vma || null,
        resting_heart_rate || null,
        weight || null,
        vo2max || null,
        lactate_threshold_pace || null,
        athleteId
      ]
    );

    // Save to history if notes provided or significant metrics changed
    if (notes || max_heart_rate || vma || weight) {
      const historyId = generateId();
      await client.query(
        `INSERT INTO athlete_metrics_history 
         (id, athlete_id, max_heart_rate, vma, resting_heart_rate, weight, vo2max, lactate_threshold_pace, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          historyId,
          athleteId,
          max_heart_rate || null,
          vma || null,
          resting_heart_rate || null,
          weight || null,
          vo2max || null,
          lactate_threshold_pace || null,
          notes || null
        ]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update athlete metrics error:', error);
    res.status(500).json({ message: 'Failed to update athlete metrics' });
  }
});

// Get athlete metrics history
router.get('/:athleteId/metrics-history', authenticateToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    // Verify access (coach or the athlete themselves)
    const athleteCheck = await client.query(
      'SELECT coach_id, user_id FROM athletes WHERE id = $1',
      [athleteId]
    );

    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    const { coach_id, user_id } = athleteCheck.rows[0];
    
    // Check if user is the coach or the athlete
    if (req.userId !== coach_id && req.userId !== user_id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await client.query(
      `SELECT * FROM athlete_metrics_history
       WHERE athlete_id = $1
       ORDER BY recorded_at DESC
       LIMIT 50`,
      [athleteId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch metrics history error:', error);
    res.status(500).json({ message: 'Failed to fetch metrics history' });
  }
});

export default router;
