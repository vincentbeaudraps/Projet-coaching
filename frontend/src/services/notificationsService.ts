// filepath: frontend/src/services/notificationsService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Notification {
  id: string;
  user_id: string;
  type: 'new_session' | 'session_modified' | 'session_deleted' | 'new_message' | 'activity_completed' | 'goal_achieved' | 'record_broken' | 'invitation_accepted' | 'feedback_received';
  title: string;
  message: string;
  link?: string;
  related_id?: string;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

class NotificationsService {
  /**
   * Get all notifications for current user
   */
  async getAll(unreadOnly: boolean = false): Promise<NotificationsResponse> {
    const token = localStorage.getItem('token');
    const response = await axios.get<NotificationsResponse>(
      `${API_URL}/notifications${unreadOnly ? '?unreadOnly=true' : ''}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const token = localStorage.getItem('token');
    const response = await axios.get<{ count: number }>(
      `${API_URL}/notifications/unread-count`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.put(
      `${API_URL}/notifications/${notificationId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.put(
      `${API_URL}/notifications/read-all`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/notifications/${notificationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Delete all notifications
   */
  async deleteAll(): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export default new NotificationsService();
