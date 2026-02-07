import express, { Router, Request, Response } from 'express';
import client from '../database/connection.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { generateId } from '../utils/id.js';
import { asyncHandler, NotFoundError, BadRequestError, ConflictError } from '../middleware/errorHandler.js';
import { athleteService } from '../services/athleteService.js';
import { trainingLoadService } from '../services/trainingLoadService.js';

const router: Router = express.Router();

// Get current athlete profile (for authenticated athlete)
router.get('/me', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  
  const result = await client.query(
    `SELECT a.*, u.email as user_email, u.name as user_name 
     FROM athletes a 
     JOIN users u ON a.user_id = u.id 
     WHERE a.user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  res.json(result.rows[0]);
}));

// Get all athletes for a coach
router.get('/', authenticateToken, authorizeRole('coach'), asyncHandler(async (req: Request, res: Response) => {
  const coachId = req.userId!;
  const athletes = await athleteService.getAthletesByCoach(coachId);
  
  // Désactiver le cache pour les données dynamiques
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.json(athletes);
}));

// Add athlete for coach
router.post('/', authenticateToken, authorizeRole('coach'), asyncHandler(async (req: Request, res: Response) => {
  const { userId, age, level, goals } = req.body;
  const coachId = req.userId!;

  if (!userId) {
    throw new BadRequestError('User ID is required');
  }

  const result = await client.query(
    `INSERT INTO athletes (user_id, coach_id, age, level, goals) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING *`,
    [userId, coachId, age, level, goals]
  );

  res.status(201).json(result.rows[0]);
}));

// Get athlete details
router.get('/:athleteId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const userId = req.userId!;
  const userRole = req.userRole!;

  // Verify access
  await athleteService.verifyAccess(athleteId, userId, userRole);

  const result = await client.query(
    `SELECT a.*, u.email as user_email, u.name as user_name 
     FROM athletes a 
     JOIN users u ON a.user_id = u.id 
     WHERE a.id = $1`,
    [athleteId]
  );

  if (!result.rows[0]) {
    throw new NotFoundError('Athlete not found');
  }

  res.json(result.rows[0]);
}));

// Update athlete
router.put('/:athleteId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const { age, level, goals } = req.body;
  const userId = req.userId!;
  const userRole = req.userRole!;

  // Verify access
  await athleteService.verifyAccess(athleteId, userId, userRole);

  const result = await client.query(
    `UPDATE athletes SET age = $1, level = $2, goals = $3 
     WHERE id = $4 
     RETURNING *`,
    [age, level, goals, athleteId]
  );

  if (!result.rows[0]) {
    throw new NotFoundError('Athlete not found');
  }

  res.json(result.rows[0]);
}));

// Create athlete account (creates user + athlete profile)
router.post('/create-account', authenticateToken, authorizeRole('coach'), asyncHandler(async (req: Request, res: Response) => {
  const { email, name, age, level, goals } = req.body;
  const coachId = req.userId!;

  if (!email || !name) {
    throw new BadRequestError('Email and name are required');
  }

  // Check if user already exists
  const existingUser = await athleteService.checkUserExists(email);
  if (existingUser) {
    throw new ConflictError('Un utilisateur avec cet email existe déjà');
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
}));

// Delete athlete
router.delete('/:athleteId', authenticateToken, authorizeRole('coach'), asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const coachId = req.userId!;

  // Verify that this athlete belongs to this coach
  await athleteService.verifyCoachOwnership(athleteId, coachId);

  const athleteCheck = await client.query(
    'SELECT user_id FROM athletes WHERE id = $1',
    [athleteId]
  );

  if (!athleteCheck.rows[0]) {
    throw new NotFoundError('Athlete not found');
  }

  const userId = athleteCheck.rows[0].user_id;

  // Delete athlete (will cascade delete sessions and performances)
  await client.query('DELETE FROM athletes WHERE id = $1', [athleteId]);
  
  // Delete user account
  await client.query('DELETE FROM users WHERE id = $1', [userId]);

  res.json({ message: 'Athlete deleted successfully' });
}));

// Update athlete metrics
router.put('/:athleteId/metrics', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const userId = req.userId!;
  const userRole = req.userRole!;
  const {
    max_heart_rate,
    vma,
    resting_heart_rate,
    weight,
    vo2max,
    lactate_threshold_pace,
    notes
  } = req.body;

  // Verify authorization: coach owns athlete OR athlete is updating their own profile
  await athleteService.verifyAccess(athleteId, userId, userRole);

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

  if (!result.rows[0]) {
    throw new NotFoundError('Athlete not found');
  }

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
}));

// Get athlete metrics history
router.get('/:athleteId/metrics-history', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const userId = req.userId!;
  const userRole = req.userRole!;

  // Verify access (coach or the athlete themselves)
  await athleteService.verifyAccess(athleteId, userId, userRole);

  const result = await client.query(
    `SELECT * FROM athlete_metrics_history
     WHERE athlete_id = $1
     ORDER BY recorded_at DESC
     LIMIT 50`,
    [athleteId]
  );

  res.json(result.rows);
}));

// ============================
// ENRICHED PROFILE ROUTES
// ============================

// Update athlete profile (enriched fields)
router.patch('/me', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const {
    weight,
    height,
    vma,
    max_heart_rate,
    resting_heart_rate,
    birth_date,
    gender,
    profile_photo_url,
    city,
    running_experience_years,
    preferred_distances,
    injury_history,
    medical_notes
  } = req.body;

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (weight !== undefined) {
    updates.push(`weight = $${paramCount++}`);
    values.push(weight);
  }
  if (height !== undefined) {
    updates.push(`height = $${paramCount++}`);
    values.push(height);
  }
  if (vma !== undefined) {
    updates.push(`vma = $${paramCount++}`);
    values.push(vma);
  }
  if (max_heart_rate !== undefined) {
    updates.push(`max_heart_rate = $${paramCount++}`);
    values.push(max_heart_rate);
  }
  if (resting_heart_rate !== undefined) {
    updates.push(`resting_heart_rate = $${paramCount++}`);
    values.push(resting_heart_rate);
  }
  if (birth_date !== undefined) {
    updates.push(`birth_date = $${paramCount++}`);
    values.push(birth_date);
  }
  if (gender !== undefined) {
    updates.push(`gender = $${paramCount++}`);
    values.push(gender);
  }
  if (profile_photo_url !== undefined) {
    updates.push(`profile_photo_url = $${paramCount++}`);
    values.push(profile_photo_url);
  }
  if (city !== undefined) {
    updates.push(`city = $${paramCount++}`);
    values.push(city);
  }
  if (running_experience_years !== undefined) {
    updates.push(`running_experience_years = $${paramCount++}`);
    values.push(running_experience_years);
  }
  if (preferred_distances !== undefined) {
    updates.push(`preferred_distances = $${paramCount++}`);
    values.push(preferred_distances);
  }
  if (injury_history !== undefined) {
    updates.push(`injury_history = $${paramCount++}`);
    values.push(injury_history);
  }
  if (medical_notes !== undefined) {
    updates.push(`medical_notes = $${paramCount++}`);
    values.push(medical_notes);
  }

  if (updates.length === 0) {
    throw new BadRequestError('No fields to update');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const query = `
    UPDATE athletes 
    SET ${updates.join(', ')}
    WHERE user_id = $${paramCount}
    RETURNING *
  `;

  const result = await client.query(query, values);

  if (result.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  res.json(result.rows[0]);
}));

// Get personal records for authenticated athlete
router.get('/me/records', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  // Get athlete ID from user ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;

  // Get all personal records
  const result = await client.query(
    `SELECT * FROM athlete_records 
     WHERE athlete_id = $1 
     ORDER BY date_achieved DESC`,
    [athleteId]
  );

  res.json(result.rows);
}));

// Add a personal record
router.post('/me/records', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const {
    distance_type,
    distance_km,
    time_seconds,
    pace,
    location,
    race_name,
    date_achieved,
    notes
  } = req.body;

  // Validation
  if (!distance_type || !distance_km || !time_seconds || !date_achieved) {
    throw new BadRequestError('distance_type, distance_km, time_seconds, and date_achieved are required');
  }

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;
  const recordId = generateId();

  const result = await client.query(
    `INSERT INTO athlete_records 
     (id, athlete_id, distance_type, distance_km, time_seconds, pace, location, race_name, date_achieved, notes) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
     RETURNING *`,
    [recordId, athleteId, distance_type, distance_km, time_seconds, pace, location, race_name, date_achieved, notes]
  );

  res.status(201).json(result.rows[0]);
}));

// Update a personal record
router.put('/me/records/:recordId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { recordId } = req.params;
  const {
    distance_type,
    distance_km,
    time_seconds,
    pace,
    location,
    race_name,
    date_achieved,
    notes
  } = req.body;

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;

  // Verify ownership
  const ownershipCheck = await client.query(
    'SELECT id FROM athlete_records WHERE id = $1 AND athlete_id = $2',
    [recordId, athleteId]
  );

  if (ownershipCheck.rows.length === 0) {
    throw new NotFoundError('Record not found or unauthorized');
  }

  const result = await client.query(
    `UPDATE athlete_records 
     SET distance_type = $1, distance_km = $2, time_seconds = $3, pace = $4, 
         location = $5, race_name = $6, date_achieved = $7, notes = $8
     WHERE id = $9 
     RETURNING *`,
    [distance_type, distance_km, time_seconds, pace, location, race_name, date_achieved, notes, recordId]
  );

  res.json(result.rows[0]);
}));

// Delete a personal record
router.delete('/me/records/:recordId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { recordId } = req.params;

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;

  const result = await client.query(
    'DELETE FROM athlete_records WHERE id = $1 AND athlete_id = $2 RETURNING *',
    [recordId, athleteId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Record not found or unauthorized');
  }

  res.json({ message: 'Record deleted successfully' });
}));

// Get upcoming races for authenticated athlete
router.get('/me/races', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;

  // Get upcoming races
  const result = await client.query(
    `SELECT * FROM races 
     WHERE athlete_id = $1 
     ORDER BY date ASC`,
    [athleteId]
  );

  res.json(result.rows);
}));

// Add an upcoming race
router.post('/me/races', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const {
    name,
    location,
    date,
    distance_km,
    distance_label,
    elevation_gain,
    target_time,
    registration_status,
    race_url,
    notes
  } = req.body;

  // Validation
  if (!name || !date || !distance_km) {
    throw new BadRequestError('name, date, and distance_km are required');
  }

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;
  const raceId = generateId();

  const result = await client.query(
    `INSERT INTO races 
     (id, athlete_id, name, location, date, distance_km, distance_label, elevation_gain, target_time, registration_status, race_url, notes) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
     RETURNING *`,
    [raceId, athleteId, name, location, date, distance_km, distance_label, elevation_gain, target_time, registration_status || 'planned', race_url, notes]
  );

  res.status(201).json(result.rows[0]);
}));

// Update an upcoming race
router.put('/me/races/:raceId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { raceId } = req.params;
  const {
    name,
    location,
    date,
    distance_km,
    distance_label,
    elevation_gain,
    target_time,
    registration_status,
    race_url,
    notes
  } = req.body;

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;

  // Verify ownership
  const ownershipCheck = await client.query(
    'SELECT id FROM races WHERE id = $1 AND athlete_id = $2',
    [raceId, athleteId]
  );

  if (ownershipCheck.rows.length === 0) {
    throw new NotFoundError('Race not found or unauthorized');
  }

  const result = await client.query(
    `UPDATE races 
     SET name = $1, location = $2, date = $3, distance_km = $4, distance_label = $5, 
         elevation_gain = $6, target_time = $7, registration_status = $8, race_url = $9, notes = $10
     WHERE id = $11 
     RETURNING *`,
    [name, location, date, distance_km, distance_label, elevation_gain, target_time, registration_status, race_url, notes, raceId]
  );

  res.json(result.rows[0]);
}));

// Delete an upcoming race
router.delete('/me/races/:raceId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { raceId } = req.params;

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;

  const result = await client.query(
    'DELETE FROM races WHERE id = $1 AND athlete_id = $2 RETURNING *',
    [raceId, athleteId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Race not found or unauthorized');
  }

  res.json({ message: 'Race deleted successfully' });
}));

// Get yearly statistics for authenticated athlete
router.get('/me/yearly-stats', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;

  // Get yearly statistics from performance_records and training_sessions
  const result = await client.query(
    `SELECT 
       EXTRACT(YEAR FROM ts.start_date) as year,
       COUNT(DISTINCT ts.id) as total_sessions,
       COALESCE(SUM(CASE WHEN pr.actual_distance IS NOT NULL THEN pr.actual_distance ELSE ts.distance END), 0) as total_distance_km,
       COALESCE(SUM(CASE WHEN pr.actual_duration IS NOT NULL THEN pr.actual_duration ELSE ts.duration END) / 3600.0, 0) as total_time_hours
     FROM training_sessions ts
     LEFT JOIN performance_records pr ON pr.session_id = ts.id
     WHERE ts.athlete_id = $1 
     GROUP BY EXTRACT(YEAR FROM ts.start_date)
     ORDER BY year DESC
     LIMIT 5`,
    [athleteId]
  );

  res.json(result.rows);
}));

// Get annual volumes for authenticated athlete
router.get('/me/annual-volumes', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;

  // Get all annual volumes
  const result = await client.query(
    `SELECT * FROM annual_volume 
     WHERE athlete_id = $1 
     ORDER BY year DESC`,
    [athleteId]
  );

  res.json(result.rows);
}));

// Add or update annual volume
router.post('/me/annual-volumes', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { year, volume_km, notes } = req.body;

  // Validation
  if (!year || volume_km === undefined) {
    throw new BadRequestError('year and volume_km are required');
  }

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;

  // Check if entry exists
  const existingResult = await client.query(
    'SELECT id FROM annual_volume WHERE athlete_id = $1 AND year = $2',
    [athleteId, year]
  );

  let result;
  if (existingResult.rows.length > 0) {
    // Update existing
    result = await client.query(
      `UPDATE annual_volume 
       SET volume_km = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE athlete_id = $3 AND year = $4
       RETURNING *`,
      [volume_km, notes, athleteId, year]
    );
  } else {
    // Insert new
    const volumeId = generateId();
    result = await client.query(
      `INSERT INTO annual_volume (id, athlete_id, year, volume_km, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [volumeId, athleteId, year, volume_km, notes]
    );
  }

  res.status(201).json(result.rows[0]);
}));

// Delete annual volume
router.delete('/me/annual-volumes/:year', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { year } = req.params;

  // Get athlete ID
  const athleteResult = await client.query(
    'SELECT id FROM athletes WHERE user_id = $1',
    [userId]
  );

  if (athleteResult.rows.length === 0) {
    throw new NotFoundError('Athlete profile not found');
  }

  const athleteId = athleteResult.rows[0].id;

  const result = await client.query(
    'DELETE FROM annual_volume WHERE athlete_id = $1 AND year = $2 RETURNING *',
    [athleteId, year]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Annual volume not found');
  }

  res.json({ message: 'Annual volume deleted successfully' });
}));

// Get athlete detailed statistics (for coach)
router.get('/:athleteId/detailed-stats', authenticateToken, authorizeRole('coach'), asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const coachId = req.userId!;
  const { weeks = 12 } = req.query; // Par défaut 12 semaines

  // Verify that this athlete belongs to this coach
  const athleteCheck = await client.query(
    'SELECT id, user_id FROM athletes WHERE id = $1 AND coach_id = $2',
    [athleteId, coachId]
  );

  if (athleteCheck.rows.length === 0) {
    throw new NotFoundError('Athlete not found or unauthorized');
  }

    // 1. Charge d'entraînement hebdomadaire (dernières X semaines)
    // Utilisation de formules scientifiques : TRIMP et Session RPE
    const weeksNumber = parseInt(weeks as string) || 12;
    
    // Get athlete's max HR for TRIMP calculation
    const athleteData = await client.query(
      'SELECT max_heart_rate, resting_heart_rate FROM athletes WHERE id = $1',
      [athleteId]
    );
    const maxHR = athleteData.rows[0]?.max_heart_rate || 190; // Default 190 if not set
    const restingHR = athleteData.rows[0]?.resting_heart_rate || 60; // Default 60 if not set
    
    const trainingLoadQuery = await client.query(
      `WITH weekly_stats AS (
        SELECT 
          DATE_TRUNC('week', ca.start_date) as week_start,
          COUNT(*) as sessions_count,
          SUM(COALESCE(ca.distance, 0)) as total_distance,
          SUM(COALESCE(ca.duration, 0)) as total_duration,
          AVG(ca.avg_heart_rate) as avg_hr,
          MAX(ca.max_heart_rate) as max_hr,
          SUM(COALESCE(ca.elevation_gain, 0)) as total_elevation,
          -- Session RPE (Foster method): Durée × Effort perçu
          SUM(
            COALESCE(ca.duration, 0) / 60.0 * 
            COALESCE(ca.difficulty_rating, 5)
          ) as total_session_rpe,
          -- TRIMP simplifié (Banister): Durée × HR% × Facteur
          SUM(
            CASE 
              WHEN ca.avg_heart_rate IS NOT NULL AND ca.avg_heart_rate > 0 THEN
                (ca.duration / 60.0) * 
                ((ca.avg_heart_rate - $3) / ($4 - $3)) * 
                CASE 
                  WHEN ca.avg_heart_rate < ($3 + 0.5 * ($4 - $3)) THEN 1.0
                  WHEN ca.avg_heart_rate < ($3 + 0.7 * ($4 - $3)) THEN 1.5
                  WHEN ca.avg_heart_rate < ($3 + 0.85 * ($4 - $3)) THEN 2.0
                  ELSE 2.5
                END
              ELSE 0
            END
          ) as total_trimp
        FROM completed_activities ca
        WHERE ca.athlete_id = $1 
          AND ca.start_date >= CURRENT_DATE - ($2 || ' weeks')::INTERVAL
        GROUP BY DATE_TRUNC('week', ca.start_date)
        ORDER BY week_start DESC
      )
      SELECT 
        TO_CHAR(week_start, 'YYYY-MM-DD') as week,
        sessions_count,
        ROUND(CAST(total_distance as numeric), 2) as distance_km,
        total_duration as duration_seconds,
        ROUND(CAST(avg_hr as numeric), 0) as avg_hr,
        max_hr,
        total_elevation,
        ROUND(CAST(total_session_rpe as numeric), 1) as session_rpe_load,
        ROUND(CAST(total_trimp as numeric), 1) as trimp_load,
        ROUND(CAST((total_session_rpe + total_trimp) / 2 as numeric), 1) as combined_load
      FROM weekly_stats`,
      [athleteId, weeksNumber, restingHR, maxHR]
    );

    // 2. Activités récentes (derniers 30 jours)
    const recentActivitiesQuery = await client.query(
      `SELECT 
        ca.id,
        ca.start_date as date,
        ca.activity_type,
        ca.distance as distance_km,
        ca.duration as duration_seconds,
        ca.avg_pace,
        ca.avg_heart_rate,
        ca.max_heart_rate,
        ca.elevation_gain,
        ca.difficulty_rating,
        ca.feeling_rating,
        ca.notes
      FROM completed_activities ca
      WHERE ca.athlete_id = $1 
        AND ca.start_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY ca.start_date DESC
      LIMIT 20`,
      [athleteId]
    );

    // 3. Records et performances
    const performancesQuery = await client.query(
      `SELECT 
        id,
        distance_type,
        distance_km,
        time_seconds,
        pace,
        location,
        race_name,
        date_achieved
      FROM athlete_records
      WHERE athlete_id = $1
      ORDER BY date_achieved DESC
      LIMIT 10`,
      [athleteId]
    );

    // 4. Statistiques globales
    const globalStatsQuery = await client.query(
      `SELECT 
        COUNT(*) as total_activities,
        ROUND(CAST(SUM(COALESCE(ca.distance, 0)) as numeric), 2) as total_distance,
        SUM(COALESCE(ca.duration, 0)) as total_duration,
        ROUND(CAST(AVG(COALESCE(ca.distance, 0)) as numeric), 2) as avg_distance,
        ROUND(CAST(AVG(ca.avg_heart_rate) as numeric), 0) as avg_hr,
        COUNT(CASE WHEN ca.start_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as activities_last_7_days,
        COUNT(CASE WHEN ca.start_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as activities_last_30_days
      FROM completed_activities ca
      WHERE ca.athlete_id = $1`,
      [athleteId]
    );

    // 5. Distribution par zone d'entraînement (derniers 30 jours)
    // Note: La colonne training_zone n'existe pas encore dans completed_activities
    // Retourner un tableau vide en attendant l'ajout de cette fonctionnalité
    const zoneDistributionQuery = { rows: [] };

    // 6. Anomalies et alertes (basées sur la charge scientifique)
    const anomalies: any[] = [];

    // Utiliser la charge combinée (TRIMP + Session RPE) au lieu du volume
    const weeklyLoads = trainingLoadQuery.rows.map((w: any) => Number(w.combined_load) || 0);
    
    // Calculer l'ACWR (Acute:Chronic Workload Ratio) - Méthode Gabbett
    if (weeklyLoads.length >= 4) {
      const acuteLoad = weeklyLoads[0]; // Dernière semaine
      const chronicLoad = weeklyLoads.slice(0, 4).reduce((a: number, b: number) => a + b, 0) / 4; // Moyenne 4 semaines
      
      if (chronicLoad > 0) {
        const acwr = acuteLoad / chronicLoad;
        
        // Zone de danger : ACWR > 1.5 (Gabbett 2016)
        if (acwr > 1.5) {
          anomalies.push({
            type: 'high_acwr',
            severity: 'danger',
            message: 'Ratio charge aiguë/chronique élevé - Risque de blessure augmenté',
            value: acwr.toFixed(2),
            details: `ACWR: ${acwr.toFixed(2)} (recommandé: 0.8-1.3)`
          });
        }
        // Zone d'attention : ACWR > 1.3
        else if (acwr > 1.3) {
          anomalies.push({
            type: 'moderate_acwr',
            severity: 'warning',
            message: 'Augmentation de charge à surveiller',
            value: acwr.toFixed(2),
            details: `ACWR: ${acwr.toFixed(2)} (optimal: 0.8-1.3)`
          });
        }
        // Déconditionnement : ACWR < 0.8
        else if (acwr < 0.8 && acuteLoad > 0) {
          anomalies.push({
            type: 'low_acwr',
            severity: 'info',
            message: 'Charge réduite - Risque de déconditionnement',
            value: acwr.toFixed(2),
            details: `ACWR: ${acwr.toFixed(2)} (augmentation possible)`
          });
        }
      }
    }

    // Vérifier la monotonie (ratio écart-type / moyenne de charge) - Foster
    if (weeklyLoads.length >= 4) {
      const avgLoad = weeklyLoads.reduce((a: number, b: number) => a + b, 0) / weeklyLoads.length;
      const variance = weeklyLoads.reduce((sum: number, load: number) => sum + Math.pow(load - avgLoad, 2), 0) / weeklyLoads.length;
      const stdDev = Math.sqrt(variance);
      const monotony = avgLoad > 0 && stdDev > 0 ? avgLoad / stdDev : 0;

      // Monotonie > 2.0 = Danger (Foster 2001)
      if (monotony > 2.0) {
        anomalies.push({
          type: 'high_monotony',
          severity: 'danger',
          message: 'Monotonie excessive - Risque élevé de surentraînement',
          value: monotony.toFixed(2),
          details: 'Variez l\'intensité et le volume des séances'
        });
      }
      // Monotonie > 1.5 = Attention
      else if (monotony > 1.5) {
        anomalies.push({
          type: 'moderate_monotony',
          severity: 'warning',
          message: 'Monotonie élevée détectée',
          value: monotony.toFixed(2),
          details: 'Ajouter de la variété dans l\'entraînement'
        });
      }
    }

    // Calculer le Training Strain (Monotonie × Charge totale) - Foster
    if (weeklyLoads.length >= 4) {
      const totalLoad = weeklyLoads.reduce((a: number, b: number) => a + b, 0);
      const avgLoad = totalLoad / weeklyLoads.length;
      const stdDev = Math.sqrt(weeklyLoads.reduce((sum: number, load: number) => sum + Math.pow(load - avgLoad, 2), 0) / weeklyLoads.length);
      const monotony = avgLoad > 0 && stdDev > 0 ? avgLoad / stdDev : 0;
      const strain = totalLoad * monotony;
      
      // Strain > 6000 = Risque élevé (Foster 2001)
      if (strain > 6000) {
        anomalies.push({
          type: 'high_strain',
          severity: 'danger',
          message: 'Contrainte d\'entraînement excessive',
          value: strain.toFixed(0),
          details: 'Risque de surentraînement - Réduction recommandée'
        });
      }
    }

    // Vérifier l'inactivité (aucune activité depuis 7 jours)
    const lastActivity = recentActivitiesQuery.rows[0];
    if (!lastActivity || (new Date().getTime() - new Date(lastActivity.date).getTime()) > 7 * 24 * 60 * 60 * 1000) {
      anomalies.push({
        type: 'inactivity',
        severity: 'warning',
        message: 'Aucune activité enregistrée depuis plus de 7 jours'
      });
    }

    // Vérifier la fréquence cardiaque élevée
    // Vérifier la fréquence cardiaque élevée
  const recentHighHR = recentActivitiesQuery.rows.filter((a: any) => 
    a.avg_heart_rate && a.avg_heart_rate > 170
  );
  if (recentHighHR.length >= 3) {
    anomalies.push({
      type: 'high_hr_frequency',
      severity: 'info',
      message: `${recentHighHR.length} séances récentes avec FC moyenne > 170 bpm`
    });
  }

  res.json({
    weeklyLoad: trainingLoadQuery.rows,
    recentActivities: recentActivitiesQuery.rows,
    performances: performancesQuery.rows,
    globalStats: globalStatsQuery.rows[0] || {},
    zoneDistribution: zoneDistributionQuery.rows,
    anomalies
  });
}));

// Get athlete weekly progression (for coach)
router.get('/:athleteId/weekly-progression', authenticateToken, authorizeRole('coach'), asyncHandler(async (req: Request, res: Response) => {
  const { athleteId } = req.params;
  const coachId = req.userId!;
  const { weeks = 24 } = req.query;

  // Verify athlete belongs to coach
  const athleteCheck = await client.query(
    'SELECT id FROM athletes WHERE id = $1 AND coach_id = $2',
    [athleteId, coachId]
  );

  if (athleteCheck.rows.length === 0) {
    throw new NotFoundError('Athlete not found or unauthorized');
  }

  // Récupérer la progression hebdomadaire avec calculs avancés
  const weeksNumber = parseInt(weeks as string) || 24;
  const result = await client.query(
    `WITH weekly_data AS (
      SELECT 
        DATE_TRUNC('week', date) as week_start,
        COUNT(*) as sessions,
        SUM(distance_km) as distance,
        SUM(duration_seconds) as duration,
        AVG(avg_heart_rate) as avg_hr,
        AVG(perceived_effort) as avg_effort,
        SUM(elevation_gain) as elevation
      FROM completed_activities
      WHERE athlete_id = $1 
        AND date >= CURRENT_DATE - ($2 || ' weeks')::INTERVAL
      GROUP BY DATE_TRUNC('week', date)
    ),
    weekly_with_lag AS (
      SELECT 
        *,
        LAG(distance) OVER (ORDER BY week_start) as prev_distance,
        LAG(duration) OVER (ORDER BY week_start) as prev_duration
      FROM weekly_data
    )
    SELECT 
      TO_CHAR(week_start, 'YYYY-MM-DD') as week,
      sessions,
      ROUND(CAST(distance as numeric), 2) as distance_km,
      duration as duration_seconds,
      ROUND(CAST(avg_hr as numeric), 0) as avg_hr,
      ROUND(CAST(avg_effort as numeric), 1) as avg_effort,
      elevation,
      CASE 
        WHEN prev_distance > 0 
        THEN ROUND(((distance - prev_distance) / prev_distance * 100), 1)
        ELSE 0 
      END as distance_change_percent
    FROM weekly_with_lag
    ORDER BY week_start DESC`,
    [athleteId, weeksNumber]
  );

  res.json(result.rows);
}));

export default router;
