import express, { Router } from 'express';
import client from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router: Router = express.Router();

// Send message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.userId;

    const result = await client.query(
      `INSERT INTO messages (sender_id, receiver_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [senderId, receiverId, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Get messages between two users
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const result = await client.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [currentUserId, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Mark messages as read
router.put('/read/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    await client.query(
      `UPDATE messages SET read = true 
       WHERE sender_id = $1 AND receiver_id = $2 AND read = false`,
      [userId, currentUserId]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

export default router;
