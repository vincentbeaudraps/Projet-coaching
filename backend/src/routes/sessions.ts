import express, { Router } from 'express';
import client from '../database/connection.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { generateId } from '../utils/id.js';
import { exportToTCX, exportToGarminJSON, exportToText, exportToMarkdown } from '../utils/workoutExporter.js';

const router: Router = express.Router();

// Create training session
router.post('/', authenticateToken, authorizeRole('coach'), async (req, res) => {
  try {
    const { athleteId, title, description, type, distance, duration, intensity, startDate, blocks, notes } = req.body;
    const coachId = req.userId;
    const sessionId = generateId(); // Générer un ID unique

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

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Create session error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Failed to create session', error: error.message });
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
