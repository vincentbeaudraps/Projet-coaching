import axios from 'axios';

const API_URL = 'http://localhost:3000/api/feedback';

export interface SessionFeedback {
  id: string;
  sessionId: string;
  athleteId: string;
  feelingRating?: number;
  difficultyRating?: number;
  fatigueRating?: number;
  athleteNotes?: string;
  coachComment?: string;
  completedDistance?: number;
  completedDuration?: number;
  avgHeartRate?: number;
  avgPace?: string;
  createdAt: string;
  updatedAt: string;
  athleteName?: string;
  sessionTitle?: string;
  startDate?: string;
}

export interface FeedbackStats {
  totalFeedback: number;
  avgFeeling: number;
  avgDifficulty: number;
  avgFatigue: number;
  withCoachResponse: number;
}

export interface CreateFeedbackData {
  sessionId: string;
  feelingRating?: number;
  difficultyRating?: number;
  fatigueRating?: number;
  athleteNotes?: string;
  completedDistance?: number;
  completedDuration?: number;
  avgHeartRate?: number;
  avgPace?: string;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Create or update feedback
export const submitFeedback = async (data: CreateFeedbackData): Promise<SessionFeedback> => {
  const response = await axios.post(API_URL, data, getAuthHeader());
  return response.data.feedback;
};

// Get feedback for a session
export const getSessionFeedback = async (sessionId: string): Promise<SessionFeedback | null> => {
  try {
    const response = await axios.get(`${API_URL}/session/${sessionId}`, getAuthHeader());
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Get all feedback for an athlete
export const getAthleteFeedback = async (athleteId: string): Promise<SessionFeedback[]> => {
  const response = await axios.get(`${API_URL}/athlete/${athleteId}`, getAuthHeader());
  return response.data;
};

// Add coach comment
export const addCoachComment = async (feedbackId: string, coachComment: string): Promise<SessionFeedback> => {
  const response = await axios.patch(
    `${API_URL}/${feedbackId}/coach-comment`,
    { coachComment },
    getAuthHeader()
  );
  return response.data.feedback;
};

// Delete feedback
export const deleteFeedback = async (feedbackId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${feedbackId}`, getAuthHeader());
};

// Get feedback statistics
export const getFeedbackStats = async (athleteId: string): Promise<FeedbackStats> => {
  const response = await axios.get(`${API_URL}/stats/athlete/${athleteId}`, getAuthHeader());
  return response.data;
};

export default {
  submitFeedback,
  getSessionFeedback,
  getAthleteFeedback,
  addCoachComment,
  deleteFeedback,
  getFeedbackStats
};
