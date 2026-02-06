import axios from 'axios';

const API_URL = 'http://localhost:3000/api/goals';

export interface Goal {
  id: string;
  athleteId: string;
  coachId: string;
  title: string;
  description?: string;
  goalType: 'race' | 'distance' | 'time' | 'pace' | 'vma' | 'weight' | 'other';
  targetValue?: string;
  targetDate?: string;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  priority: number;
  progress: number;
  raceName?: string;
  raceDistance?: number;
  raceLocation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  coachName?: string;
  athleteName?: string;
}

export interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  abandonedGoals: number;
  avgProgress: number;
  overdueGoals: number;
}

export interface CreateGoalData {
  athleteId: string;
  title: string;
  description?: string;
  goalType: string;
  targetValue?: string;
  targetDate?: string;
  priority?: number;
  raceName?: string;
  raceDistance?: number;
  raceLocation?: string;
  notes?: string;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Create goal
export const createGoal = async (data: CreateGoalData): Promise<Goal> => {
  const response = await axios.post(API_URL, data, getAuthHeader());
  return response.data.goal;
};

// Get all goals for an athlete
export const getAthleteGoals = async (athleteId: string, status?: string): Promise<Goal[]> => {
  const params = status ? { status } : {};
  const response = await axios.get(`${API_URL}/athlete/${athleteId}`, {
    ...getAuthHeader(),
    params
  });
  return response.data;
};

// Get a specific goal
export const getGoal = async (goalId: string): Promise<Goal> => {
  const response = await axios.get(`${API_URL}/${goalId}`, getAuthHeader());
  return response.data;
};

// Update goal
export const updateGoal = async (goalId: string, data: Partial<CreateGoalData> & { status?: string; progress?: number }): Promise<Goal> => {
  const response = await axios.patch(`${API_URL}/${goalId}`, data, getAuthHeader());
  return response.data.goal;
};

// Delete goal
export const deleteGoal = async (goalId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${goalId}`, getAuthHeader());
};

// Get goal statistics
export const getGoalStats = async (athleteId: string): Promise<GoalStats> => {
  const response = await axios.get(`${API_URL}/stats/athlete/${athleteId}`, getAuthHeader());
  return response.data;
};

export default {
  createGoal,
  getAthleteGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  getGoalStats
};
