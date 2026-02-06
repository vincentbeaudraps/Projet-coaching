// filepath: backend/src/routes/notifications.ts
import { Router, Request, Response } from 'express';
import { client } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId } from '../utils/id.js';

const router = Router();

// ============================================
// GET /api/notifications - Get user's notifications
// ============================================
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { unreadOnly } = req.query;

    let query = `
      SELECT 
        id, user_id, type, title, message, link, related_id, read, created_at
      FROM notifications
      WHERE user_id = $1
    `;

    if (unreadOnly === 'true') {
      query += ` AND read = FALSE`;
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await client.query(query, [userId]);

    res.json({
      notifications: result.rows,
      total: result.rows.length,
      unreadCount: result.rows.filter((n: any) => !n.read).length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ============================================
// GET /api/notifications/unread-count
// ============================================
router.get('/unread-count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const result = await client.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE',
      [userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ============================================
// PUT /api/notifications/:id/read - Mark as read
// ============================================
router.put('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    await client.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ============================================
// PUT /api/notifications/read-all - Mark all as read
// ============================================
router.put('/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    await client.query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// ============================================
// DELETE /api/notifications/:id - Delete notification
// ============================================
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    await client.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ============================================
// DELETE /api/notifications - Delete all notifications
// ============================================
router.delete('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    await client.query(
      'DELETE FROM notifications WHERE user_id = $1',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
});

// ============================================
// Helper: Create notification (used by other routes)
// ============================================
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
  relatedId?: string
) {
  try {
    const id = generateId();
    await client.query(
      `INSERT INTO notifications (id, user_id, type, title, message, link, related_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userId, type, title, message, link || null, relatedId || null]
    );
    return { id, success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

export default router;
