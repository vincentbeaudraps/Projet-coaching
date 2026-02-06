import { Router, Request, Response } from 'express';
import client from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { createNotification } from './notifications.js';
import { generateId } from '../utils/id.js';

const router = Router();

/**
 * POST /api/goals
 * Create a new goal
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const coachId = req.userId;
  

  const {
    athleteId,
    title,
    description,
    goalType,
    targetValue,
    targetDate,
    priority,
    raceName,
    raceDistance,
    raceLocation,
    notes
  } = req.body;

  if (!athleteId || !title || !goalType) {
    return res.status(400).json({ error: 'Athlete ID, title, and goal type are required' });
  }

  try {
    // Verify coach has access to athlete
    const athleteCheck = await client.query(
      'SELECT user_id FROM athletes WHERE user_id = $1 AND coach_id = $2',
      [athleteId, coachId]
    );

    if (athleteCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to create goals for this athlete' });
    }

    const goalId = generateId();

    const result = await client.query(
      `INSERT INTO goals (
        id, athlete_id, coach_id, title, description, goal_type,
        target_value, target_date, priority, race_name, race_distance, race_location, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        goalId,
        athleteId,
        coachId,
        title,
        description,
        goalType,
        targetValue,
        targetDate,
        priority || 1,
        raceName,
        raceDistance,
        raceLocation,
        notes
      ]
    );

    // Get athlete name
    const athleteResult = await client.query('SELECT name FROM users WHERE id = $1', [athleteId]);
    const athleteName = athleteResult.rows[0]?.name || 'Athlète';

    // Notify athlete
    await createNotification(
      athleteId,
      'goal_achieved',
      '🎯 Nouvel objectif fixé',
      `Ton coach t'a assigné un nouvel objectif : ${title}`,
      `/dashboard`,
      goalId
    );

    res.status(201).json({
      message: 'Goal created successfully',
      goal: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

/**
 * GET /api/goals/athlete/:athleteId
 * Get all goals for an athlete
 */
router.get('/athlete/:athleteId', authenticateToken, async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const userId = req.userId;
  const { status } = req.query;

  try {
    // Verify access
    const athleteResult = await client.query(
      'SELECT coach_id FROM athletes WHERE user_id = $1',
      [athleteId]
    );

    if (athleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    const coachId = athleteResult.rows[0].coach_id;

    if (userId !== athleteId && userId !== coachId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let query = `
      SELECT g.*, u.name as coach_name
      FROM goals g
      JOIN users u ON u.id = g.coach_id
      WHERE g.athlete_id = $1
    `;
    const params: any[] = [athleteId];

    if (status) {
      query += ' AND g.status = $2';
      params.push(status);
    }

    query += ' ORDER BY g.priority DESC, g.target_date ASC';

    const result = await client.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

/**
 * GET /api/goals/:id
 * Get a specific goal
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await client.query(
      `SELECT g.*, u1.name as athlete_name, u2.name as coach_name
       FROM goals g
       JOIN users u1 ON u1.id = g.athlete_id
       JOIN users u2 ON u2.id = g.coach_id
       WHERE g.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = result.rows[0];

    if (userId !== goal.athlete_id && userId !== goal.coach_id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

/**
 * PATCH /api/goals/:id
 * Update a goal
 */
router.patch('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;
  

  const {
    title,
    description,
    goalType,
    targetValue,
    targetDate,
    status,
    priority,
    progress,
    raceName,
    raceDistance,
    raceLocation,
    notes
  } = req.body;

  try {
    // Get goal
    const goalResult = await client.query(
      'SELECT * FROM goals WHERE id = $1',
      [id]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalResult.rows[0];

    // Only coach can update
    if (userId !== goal.coach_id) {
      return res.status(403).json({ error: 'Only the coach can update goals' });
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(description);
    }
    if (goalType !== undefined) {
      updateFields.push(`goal_type = $${paramCount++}`);
      updateValues.push(goalType);
    }
    if (targetValue !== undefined) {
      updateFields.push(`target_value = $${paramCount++}`);
      updateValues.push(targetValue);
    }
    if (targetDate !== undefined) {
      updateFields.push(`target_date = $${paramCount++}`);
      updateValues.push(targetDate);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
      if (status === 'completed') {
        updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramCount++}`);
      updateValues.push(priority);
    }
    if (progress !== undefined) {
      updateFields.push(`progress = $${paramCount++}`);
      updateValues.push(progress);
    }
    if (raceName !== undefined) {
      updateFields.push(`race_name = $${paramCount++}`);
      updateValues.push(raceName);
    }
    if (raceDistance !== undefined) {
      updateFields.push(`race_distance = $${paramCount++}`);
      updateValues.push(raceDistance);
    }
    if (raceLocation !== undefined) {
      updateFields.push(`race_location = $${paramCount++}`);
      updateValues.push(raceLocation);
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const query = `
      UPDATE goals 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(query, updateValues);

    // Notify athlete if status changed to completed
    if (status === 'completed') {
      await createNotification(
        goal.athlete_id,
        'goal_achieved',
        '🎉 Objectif atteint !',
        `Félicitations ! Tu as atteint ton objectif : ${goal.title}`,
        `/dashboard`,
        id
      );
    }

    res.json({
      message: 'Goal updated successfully',
      goal: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

/**
 * DELETE /api/goals/:id
 * Delete a goal
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const goalResult = await client.query('SELECT coach_id FROM goals WHERE id = $1', [id]);

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (userId !== goalResult.rows[0].coach_id) {
      return res.status(403).json({ error: 'Only the coach can delete goals' });
    }

    await client.query('DELETE FROM goals WHERE id = $1', [id]);

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

/**
 * GET /api/goals/stats/athlete/:athleteId
 * Get goal statistics for an athlete
 */
router.get('/stats/athlete/:athleteId', authenticateToken, async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const userId = req.userId;

  try {
    // Verify access
    const athleteResult = await client.query(
      'SELECT coach_id FROM athletes WHERE user_id = $1',
      [athleteId]
    );

    if (athleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    if (userId !== athleteId && userId !== athleteResult.rows[0].coach_id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await client.query(
      `SELECT 
        COUNT(*) as total_goals,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_goals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_goals,
        COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_goals,
        ROUND(AVG(progress)::numeric, 0) as avg_progress,
        COUNT(CASE WHEN target_date < CURRENT_DATE AND status = 'active' THEN 1 END) as overdue_goals
       FROM goals
       WHERE athlete_id = $1`,
      [athleteId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching goal stats:', error);
    res.status(500).json({ error: 'Failed to fetch goal stats' });
  }
});

export default router;
