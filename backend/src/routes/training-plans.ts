import { Router, Request, Response } from 'express';
import client from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { createNotification } from './notifications.js';
import { generateId } from '../utils/id.js';

const router = Router();

/**
 * POST /api/training-plans
 * Create a new training plan
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const coachId = req.userId;
  

  const {
    athleteId,
    goalId,
    name,
    description,
    startDate,
    endDate,
    planType,
    weeklyVolumeProgression,
    notes
  } = req.body;

  if (!athleteId || !name || !startDate || !endDate) {
    return res.status(400).json({ error: 'Athlete ID, name, start date, and end date are required' });
  }

  try {
    // Verify coach has access to athlete
    const athleteCheck = await client.query(
      'SELECT user_id FROM athletes WHERE user_id = $1 AND coach_id = $2',
      [athleteId, coachId]
    );

    if (athleteCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to create plans for this athlete' });
    }

    // Calculate weeks
    const start = new Date(startDate);
    const end = new Date(endDate);
    const weeksTotal = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const planId = generateId();

    const result = await client.query(
      `INSERT INTO training_plans (
        id, athlete_id, coach_id, goal_id, name, description,
        start_date, end_date, plan_type, weeks_total, weekly_volume_progression, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        planId,
        athleteId,
        coachId,
        goalId,
        name,
        description,
        startDate,
        endDate,
        planType,
        weeksTotal,
        weeklyVolumeProgression ? JSON.stringify(weeklyVolumeProgression) : null,
        notes
      ]
    );

    // Notify athlete
    await createNotification(
      athleteId,
      'new_session',
      '📅 Nouveau plan d\'entraînement',
      `Ton coach t'a créé un plan : ${name} (${weeksTotal} semaines)`,
      `/dashboard`,
      planId
    );

    res.status(201).json({
      message: 'Training plan created successfully',
      plan: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating training plan:', error);
    res.status(500).json({ error: 'Failed to create training plan' });
  }
});

/**
 * GET /api/training-plans/athlete/:athleteId
 * Get all training plans for an athlete
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
      SELECT tp.*, u.name as coach_name, g.title as goal_title
      FROM training_plans tp
      JOIN users u ON u.id = tp.coach_id
      LEFT JOIN goals g ON g.id = tp.goal_id
      WHERE tp.athlete_id = $1
    `;
    const params: any[] = [athleteId];

    if (status) {
      query += ' AND tp.status = $2';
      params.push(status);
    }

    query += ' ORDER BY tp.start_date DESC';

    const result = await client.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching training plans:', error);
    res.status(500).json({ error: 'Failed to fetch training plans' });
  }
});

/**
 * GET /api/training-plans/:id
 * Get a specific training plan
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await client.query(
      `SELECT tp.*, u1.name as athlete_name, u2.name as coach_name, g.title as goal_title
       FROM training_plans tp
       JOIN users u1 ON u1.id = tp.athlete_id
       JOIN users u2 ON u2.id = tp.coach_id
       LEFT JOIN goals g ON g.id = tp.goal_id
       WHERE tp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training plan not found' });
    }

    const plan = result.rows[0];

    if (userId !== plan.athlete_id && userId !== plan.coach_id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching training plan:', error);
    res.status(500).json({ error: 'Failed to fetch training plan' });
  }
});

/**
 * PATCH /api/training-plans/:id
 * Update a training plan
 */
router.patch('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;
  

  const {
    name,
    description,
    startDate,
    endDate,
    planType,
    status,
    weeksCompleted,
    weeklyVolumeProgression,
    notes
  } = req.body;

  try {
    // Get plan
    const planResult = await client.query(
      'SELECT * FROM training_plans WHERE id = $1',
      [id]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Training plan not found' });
    }

    const plan = planResult.rows[0];

    // Only coach can update
    if (userId !== plan.coach_id) {
      return res.status(403).json({ error: 'Only the coach can update training plans' });
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(description);
    }
    if (startDate !== undefined) {
      updateFields.push(`start_date = $${paramCount++}`);
      updateValues.push(startDate);
    }
    if (endDate !== undefined) {
      updateFields.push(`end_date = $${paramCount++}`);
      updateValues.push(endDate);
    }
    if (planType !== undefined) {
      updateFields.push(`plan_type = $${paramCount++}`);
      updateValues.push(planType);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
    }
    if (weeksCompleted !== undefined) {
      updateFields.push(`weeks_completed = $${paramCount++}`);
      updateValues.push(weeksCompleted);
    }
    if (weeklyVolumeProgression !== undefined) {
      updateFields.push(`weekly_volume_progression = $${paramCount++}`);
      updateValues.push(JSON.stringify(weeklyVolumeProgression));
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      updateValues.push(notes);
    }

    // Recalculate weeks if dates changed
    if (startDate !== undefined || endDate !== undefined) {
      const start = new Date(startDate || plan.start_date);
      const end = new Date(endDate || plan.end_date);
      const weeksTotal = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      updateFields.push(`weeks_total = $${paramCount++}`);
      updateValues.push(weeksTotal);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const query = `
      UPDATE training_plans 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(query, updateValues);

    res.json({
      message: 'Training plan updated successfully',
      plan: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating training plan:', error);
    res.status(500).json({ error: 'Failed to update training plan' });
  }
});

/**
 * DELETE /api/training-plans/:id
 * Delete a training plan
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;
  

  try {
    const planResult = await client.query('SELECT coach_id FROM training_plans WHERE id = $1', [id]);

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Training plan not found' });
    }

    if (userId !== planResult.rows[0].coach_id) {
      return res.status(403).json({ error: 'Only the coach can delete training plans' });
    }

    await client.query('DELETE FROM training_plans WHERE id = $1', [id]);

    res.json({ message: 'Training plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting training plan:', error);
    res.status(500).json({ error: 'Failed to delete training plan' });
  }
});

/**
 * GET /api/training-plans/:id/sessions
 * Get all sessions for a training plan
 */
router.get('/:id/sessions', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Verify access to plan
    const planResult = await client.query(
      'SELECT athlete_id, coach_id, start_date, end_date FROM training_plans WHERE id = $1',
      [id]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Training plan not found' });
    }

    const plan = planResult.rows[0];

    if (userId !== plan.athlete_id && userId !== plan.coach_id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get sessions within plan date range
    const result = await client.query(
      `SELECT * FROM training_sessions
       WHERE athlete_id = $1
         AND start_date >= $2
         AND start_date <= $3
       ORDER BY start_date ASC`,
      [plan.athlete_id, plan.start_date, plan.end_date]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching plan sessions:', error);
    res.status(500).json({ error: 'Failed to fetch plan sessions' });
  }
});

/**
 * POST /api/training-plans/generate
 * Generate a training plan from template
 */
router.post('/generate', authenticateToken, async (req: Request, res: Response) => {
  const coachId = req.userId;
  

  const {
    athleteId,
    planType,
    goalId,
    startDate,
    raceDate,
    currentWeeklyVolume,
    targetWeeklyVolume
  } = req.body;

  if (!athleteId || !planType || !startDate || !raceDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify coach has access to athlete
    const athleteCheck = await client.query(
      'SELECT user_id, name FROM athletes a JOIN users u ON u.id = a.user_id WHERE a.user_id = $1 AND a.coach_id = $2',
      [athleteId, coachId]
    );

    if (athleteCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const athleteName = athleteCheck.rows[0].name;

    // Calculate plan duration
    const start = new Date(startDate);
    const race = new Date(raceDate);
    const weeksTotal = Math.ceil((race.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Generate progressive volume (simple progression: 10% increase per week until peak, then taper)
    const weeklyVolumes: number[] = [];
    const currentVol = currentWeeklyVolume || 30;
    const targetVol = targetWeeklyVolume || 60;
    const peakWeek = Math.floor(weeksTotal * 0.85); // Peak at 85% of plan

    for (let week = 0; week < weeksTotal; week++) {
      if (week < peakWeek) {
        // Build phase: progressive increase
        const progress = week / peakWeek;
        weeklyVolumes.push(Math.round(currentVol + (targetVol - currentVol) * progress));
      } else {
        // Taper phase: decrease 10% per week
        const taperProgress = (week - peakWeek) / (weeksTotal - peakWeek);
        weeklyVolumes.push(Math.round(targetVol * (1 - 0.3 * taperProgress)));
      }
    }

    // Create plan
    const planId = generateId();
    const planName = `Plan ${planType} - ${athleteName}`;
    const description = `Plan généré automatiquement pour une course de type ${planType}. Durée : ${weeksTotal} semaines.`;

    const result = await client.query(
      `INSERT INTO training_plans (
        id, athlete_id, coach_id, goal_id, name, description,
        start_date, end_date, plan_type, weeks_total, weekly_volume_progression, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
      RETURNING *`,
      [
        planId,
        athleteId,
        coachId,
        goalId,
        planName,
        description,
        startDate,
        raceDate,
        planType,
        weeksTotal,
        JSON.stringify(weeklyVolumes)
      ]
    );

    // Notify athlete
    await createNotification(
      athleteId,
      'new_session',
      '🎯 Plan d\'entraînement généré',
      `Ton coach a généré un plan ${planType} de ${weeksTotal} semaines`,
      `/dashboard`,
      planId
    );

    res.status(201).json({
      message: 'Training plan generated successfully',
      plan: result.rows[0],
      weeklyVolumes
    });
  } catch (error) {
    console.error('Error generating training plan:', error);
    res.status(500).json({ error: 'Failed to generate training plan' });
  }
});

export default router;
