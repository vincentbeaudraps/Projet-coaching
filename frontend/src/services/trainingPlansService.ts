import axios from 'axios';

const API_URL = 'http://localhost:3000/api/training-plans';

export interface TrainingPlan {
  id: string;
  athleteId: string;
  coachId: string;
  goalId?: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  planType: 'marathon' | 'half_marathon' | '10km' | '5km' | 'base_building' | 'custom';
  weeksTotal: number;
  weeksCompleted: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  weeklyVolumeProgression?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  coachName?: string;
  athleteName?: string;
  goalTitle?: string;
}

export interface CreatePlanData {
  athleteId: string;
  goalId?: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  planType: string;
  weeklyVolumeProgression?: number[];
  notes?: string;
}

export interface GeneratePlanData {
  athleteId: string;
  planType: string;
  goalId?: string;
  startDate: string;
  raceDate: string;
  currentWeeklyVolume?: number;
  targetWeeklyVolume?: number;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Create training plan
export const createTrainingPlan = async (data: CreatePlanData): Promise<TrainingPlan> => {
  const response = await axios.post(API_URL, data, getAuthHeader());
  return response.data.plan;
};

// Get all plans for an athlete
export const getAthletePlans = async (athleteId: string, status?: string): Promise<TrainingPlan[]> => {
  const params = status ? { status } : {};
  const response = await axios.get(`${API_URL}/athlete/${athleteId}`, {
    ...getAuthHeader(),
    params
  });
  return response.data;
};

// Get a specific plan
export const getTrainingPlan = async (planId: string): Promise<TrainingPlan> => {
  const response = await axios.get(`${API_URL}/${planId}`, getAuthHeader());
  return response.data;
};

// Update training plan
export const updateTrainingPlan = async (
  planId: string,
  data: Partial<CreatePlanData> & { status?: string; weeksCompleted?: number }
): Promise<TrainingPlan> => {
  const response = await axios.patch(`${API_URL}/${planId}`, data, getAuthHeader());
  return response.data.plan;
};

// Delete training plan
export const deleteTrainingPlan = async (planId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${planId}`, getAuthHeader());
};

// Get sessions for a plan
export const getPlanSessions = async (planId: string): Promise<any[]> => {
  const response = await axios.get(`${API_URL}/${planId}/sessions`, getAuthHeader());
  return response.data;
};

// Generate training plan from template
export const generateTrainingPlan = async (data: GeneratePlanData): Promise<{ plan: TrainingPlan; weeklyVolumes: number[] }> => {
  const response = await axios.post(`${API_URL}/generate`, data, getAuthHeader());
  return response.data;
};

export default {
  createTrainingPlan,
  getAthletePlans,
  getTrainingPlan,
  updateTrainingPlan,
  deleteTrainingPlan,
  getPlanSessions,
  generateTrainingPlan
};
