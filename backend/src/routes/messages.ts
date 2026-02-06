import express, { Router } from 'express';
import client from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { createNotification } from './notifications.js';
import emailService from '../utils/emailService.js';

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

    // Get sender name for notification
    const senderResult = await client.query(
      'SELECT name FROM users WHERE id = $1',
      [senderId]
    );

    const senderName = senderResult.rows[0]?.name || 'Quelqu\'un';

    // Get receiver info for email
    const receiverResult = await client.query(
      'SELECT name, email FROM users WHERE id = $1',
      [receiverId]
    );

    const receiverName = receiverResult.rows[0]?.name || 'Utilisateur';
    const receiverEmail = receiverResult.rows[0]?.email;

    // Create notification for receiver
    await createNotification(
      receiverId,
      'new_message',
      '💬 Nouveau message',
      `${senderName} vous a envoyé un message`,
      `/dashboard`,
      result.rows[0].id
    );

    // Send email notification
    if (receiverEmail) {
      await emailService.sendNewMessageEmail(
        receiverEmail,
        receiverName,
        senderName,
        content
      );
    }

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
