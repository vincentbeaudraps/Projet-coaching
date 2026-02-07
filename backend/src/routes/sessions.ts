import express, { Router, Request, Response } from 'express';
import client from '../database/connection.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { generateId } from '../utils/id.js';
import { exportToTCX, exportToGarminJSON, exportToText, exportToMarkdown } from '../utils/workoutExporter.js';
import { createNotification } from './notifications.js';
import emailService from '../utils/emailService.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import { athleteService } from '../services/athleteService.js';

const router: Router = express.Router();

// Create training session
router.post('/', authenticateToken, authorizeRole('coach'), asyncHandler(async (req: Request, res: Response) => {
  const { athleteId, title, description, type, distance, duration, intensity, startDate, blocks, notes } = req.body;
  const coachId = req.userId!;
  const sessionId = generateId();

  if (!athleteId || !title || !startDate) {
    throw new BadRequestError('AthleteId, title, and startDate are required');
  }

  // Verify coach owns this athlete
  await athleteService.verifyCoachOwnership(athleteId, coachId);

  // Insérer la séance
  await client.query(
    `INSERT INTO training_sessions 
     (id, coach_id, athlete_id, title, description, type, distance, duration, intensity, start_date, blocks, notes) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [sessionId, coachId, athleteId, title, description, type, distance, duration, intensity, startDate, blocks, notes]
  );

  // Récupérer la séance créée
  const result = await client.query(
    'SELECT * FROM training_sessions WHERE id = $1',
    [sessionId]
  );

  // Get athlete's user_id for notification
  const athleteResult = await client.query(
    'SELECT a.user_id, u.name as athlete_name, u.email as athlete_email FROM athletes a JOIN users u ON a.user_id = u.id WHERE a.id = $1',
    [athleteId]
  );

  if (athleteResult.rows.length > 0) {
    const athleteUserId = athleteResult.rows[0].user_id;
    const athleteName = athleteResult.rows[0].athlete_name;
    const athleteEmail = athleteResult.rows[0].athlete_email;
    
    // Get coach name
    const coachResult = await client.query(
      'SELECT name FROM users WHERE id = $1',
      [coachId]
    );
    const coachName = coachResult.rows[0]?.name || 'Ton coach';

    // Create notification for athlete
    await createNotification(
      athleteUserId,
      'new_session',
      '📅 Nouvelle séance programmée',
      `Ton coach t'a assigné une nouvelle séance : ${title}`,
      `/dashboard`,
      sessionId
    );

    // Send email notification
    await emailService.sendNewSessionEmail(
      athleteEmail,
      athleteName,
      title,
      new Date(startDate).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      coachName
    );
  }

  res.status(201).json(result.rows[0]);
}));

// Get sessions for athlete
router.get('/athlete/:athleteId', authenticateToken, async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { 
      search, 
      type, 
      intensity, 
      dateFrom, 
      dateTo, 
      minDuration, 
      maxDuration,
      hasZones,
      status 
    } = req.query;

    let query = `SELECT * FROM training_sessions WHERE athlete_id = $1`;
    const params: any[] = [athleteId];
    let paramIndex = 2;

    // Search filter
    if (search) {
      query += ` AND (LOWER(title) LIKE $${paramIndex} OR LOWER(notes) LIKE $${paramIndex})`;
      params.push(`%${(search as string).toLowerCase()}%`);
      paramIndex++;
    }

    // Type filter
    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Intensity filter
    if (intensity) {
      query += ` AND intensity = $${paramIndex}`;
      params.push(intensity);
      paramIndex++;
    }

    // Date range filter
    if (dateFrom) {
      query += ` AND start_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND start_date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    // Duration filter
    if (minDuration) {
      query += ` AND duration >= $${paramIndex}`;
      params.push(parseInt(minDuration as string));
      paramIndex++;
    }

    if (maxDuration) {
      query += ` AND duration <= $${paramIndex}`;
      params.push(parseInt(maxDuration as string));
      paramIndex++;
    }

    // Has zones filter
    if (hasZones === 'true') {
      query += ` AND blocks IS NOT NULL AND blocks != ''`;
    } else if (hasZones === 'false') {
      query += ` AND (blocks IS NULL OR blocks = '')`;
    }

    // Status filter (upcoming/completed)
    if (status === 'upcoming') {
      query += ` AND start_date > NOW()`;
    } else if (status === 'completed') {
      query += ` AND start_date <= NOW()`;
    }

    query += ` ORDER BY start_date DESC`;

    const result = await client.query(query, params);

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
    const { 
      search, 
      athleteId,
      type, 
      intensity, 
      dateFrom, 
      dateTo, 
      minDuration, 
      maxDuration,
      hasZones,
      status 
    } = req.query;

    let query = `SELECT * FROM training_sessions WHERE coach_id = $1`;
    const params: any[] = [coachId];
    let paramIndex = 2;

    // Athlete filter
    if (athleteId) {
      query += ` AND athlete_id = $${paramIndex}`;
      params.push(athleteId);
      paramIndex++;
    }

    // Search filter
    if (search) {
      query += ` AND (LOWER(title) LIKE $${paramIndex} OR LOWER(notes) LIKE $${paramIndex})`;
      params.push(`%${(search as string).toLowerCase()}%`);
      paramIndex++;
    }

    // Type filter
    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Intensity filter
    if (intensity) {
      query += ` AND intensity = $${paramIndex}`;
      params.push(intensity);
      paramIndex++;
    }

    // Date range filter
    if (dateFrom) {
      query += ` AND start_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND start_date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    // Duration filter
    if (minDuration) {
      query += ` AND duration >= $${paramIndex}`;
      params.push(parseInt(minDuration as string));
      paramIndex++;
    }

    if (maxDuration) {
      query += ` AND duration <= $${paramIndex}`;
      params.push(parseInt(maxDuration as string));
      paramIndex++;
    }

    // Has zones filter
    if (hasZones === 'true') {
      query += ` AND blocks IS NOT NULL AND blocks != ''`;
    } else if (hasZones === 'false') {
      query += ` AND (blocks IS NULL OR blocks = '')`;
    }

    // Status filter
    if (status === 'upcoming') {
      query += ` AND start_date > NOW()`;
    } else if (status === 'completed') {
      query += ` AND start_date <= NOW()`;
    }

    query += ` ORDER BY start_date DESC`;

    const result = await client.query(query, params);

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
    const { title, description, type, distance, duration, intensity, startDate, blocks, notes } = req.body;

    await client.query(
      `UPDATE training_sessions 
       SET title = $1, description = $2, type = $3, distance = $4, duration = $5, intensity = $6, start_date = $7, blocks = $8, notes = $9 
       WHERE id = $10`,
      [title, description, type, distance, duration, intensity, startDate, blocks, notes, sessionId]
    );

    // Récupérer la séance mise à jour
    const result = await client.query(
      'SELECT * FROM training_sessions WHERE id = $1',
      [sessionId]
    );

    // Get athlete's user_id for notification
    const athleteResult = await client.query(
      'SELECT a.user_id, u.name as athlete_name, u.email as athlete_email FROM athletes a JOIN users u ON a.user_id = u.id WHERE a.id = $1',
      [result.rows[0].athlete_id]
    );

    if (athleteResult.rows.length > 0) {
      const athleteUserId = athleteResult.rows[0].user_id;
      const athleteName = athleteResult.rows[0].athlete_name;
      const athleteEmail = athleteResult.rows[0].athlete_email;
      
      // Get coach name
      const coachResult = await client.query(
        'SELECT name FROM users WHERE id = $1',
        [req.userId]
      );
      const coachName = coachResult.rows[0]?.name || 'Ton coach';
      
      // Create notification for athlete
      await createNotification(
        athleteUserId,
        'session_modified',
        '✏️ Séance modifiée',
        `Ton coach a modifié la séance : ${title}`,
        `/dashboard`,
        sessionId
      );

      // Send email notification
      await emailService.sendSessionModifiedEmail(
        athleteEmail,
        athleteName,
        title,
        coachName
      );
    }

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

    // Get session info before deletion for notification
    const sessionResult = await client.query(
      'SELECT title, athlete_id FROM training_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length > 0) {
      const session = sessionResult.rows[0];
      
      // Get athlete's user_id
      const athleteResult = await client.query(
        'SELECT user_id FROM athletes WHERE id = $1',
        [session.athlete_id]
      );

      // Delete session
      await client.query('DELETE FROM training_sessions WHERE id = $1', [sessionId]);

      // Create notification for athlete
      if (athleteResult.rows.length > 0) {
        await createNotification(
          athleteResult.rows[0].user_id,
          'session_deleted',
          '🗑️ Séance supprimée',
          `Ton coach a supprimé la séance : ${session.title}`,
          `/dashboard`
        );
      }
    } else {
      await client.query('DELETE FROM training_sessions WHERE id = $1', [sessionId]);
    }

    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

// Export session to watch format
router.get('/:sessionId/export/:format', authenticateToken, async (req, res) => {
  try {
    const { sessionId, format } = req.params;

    // Get session data
    const sessionResult = await client.query(
      'SELECT * FROM training_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Get athlete name
    const athleteResult = await client.query(
      `SELECT u.name FROM athletes a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = $1`,
      [session.athlete_id]
    );
    const athleteName = athleteResult.rows[0]?.name || 'Athlete';

    // Parse blocks
    let blocks = [];
    try {
      blocks = session.blocks ? JSON.parse(session.blocks) : [];
    } catch (e) {
      console.error('Failed to parse blocks:', e);
    }

    const workoutData = {
      title: session.title,
      description: session.description || '',
      type: session.type,
      duration: session.duration,
      distance: session.distance,
      intensity: session.intensity,
      blocks,
    };

    // Export based on format
    switch (format.toLowerCase()) {
      case 'tcx':
        const tcxContent = exportToTCX(workoutData, athleteName);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="${session.title.replace(/[^a-z0-9]/gi, '_')}.tcx"`);
        res.send(tcxContent);
        break;

      case 'json':
      case 'garmin':
        const jsonContent = exportToGarminJSON(workoutData);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${session.title.replace(/[^a-z0-9]/gi, '_')}.json"`);
        res.json(jsonContent);
        break;

      case 'txt':
      case 'text':
        const textContent = exportToText(workoutData);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${session.title.replace(/[^a-z0-9]/gi, '_')}.txt"`);
        res.send(textContent);
        break;

      case 'md':
      case 'markdown':
        const mdContent = exportToMarkdown(workoutData);
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${session.title.replace(/[^a-z0-9]/gi, '_')}.md"`);
        res.send(mdContent);
        break;

      default:
        res.status(400).json({ message: 'Format not supported. Use: tcx, json, txt, or md' });
    }
  } catch (error: any) {
    console.error('Export session error:', error);
    res.status(500).json({ message: 'Failed to export session', error: error.message });
  }
});

export default router;
