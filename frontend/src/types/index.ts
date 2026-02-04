export interface User {
  id: string;
  email: string;
  name: string;
  role: 'coach' | 'athlete';
}

export interface Athlete {
  id: string;
  user_id: string;
  coach_id: string;
  email: string;
  name: string;
  age?: number;
  level?: string;
  goals?: string;
}

export interface TrainingSession {
  id: string;
  coach_id: string;
  athlete_id: string;
  title: string;
  description: string;
  type: string;
  distance?: number;
  duration: number;
  intensity: string;
  start_date: string;
  end_date?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface Performance {
  id: string;
  athlete_id: string;
  session_id?: string;
  actual_distance?: number;
  actual_duration: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  notes: string;
  recorded_at: string;
}
