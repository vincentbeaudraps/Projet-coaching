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
  first_name?: string;
  last_name?: string;
  age?: number;
  level?: string;
  goals?: string;
  // Properties from joined user table
  user_name?: string;
  user_email?: string;
  // Training metrics
  max_heart_rate?: number; // BPM
  vma?: number; // km/h (Vitesse Maximale Aérobie)
  resting_heart_rate?: number; // BPM
  weight?: number; // kg
  vo2max?: number; // ml/kg/min
  lactate_threshold_pace?: string; // Format: "MM:SS"
  metrics_updated_at?: string;
}

export interface AthleteMetricsHistory {
  id: string;
  athlete_id: string;
  max_heart_rate?: number;
  vma?: number;
  resting_heart_rate?: number;
  weight?: number;
  vo2max?: number;
  lactate_threshold_pace?: string;
  recorded_at: string;
  notes?: string;
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
  blocks?: string;
  notes?: string;
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

export interface CompletedActivity {
  id: string;
  athlete_id: string;
  activity_type: string;
  title: string;
  start_date: string;
  duration: number;
  distance?: number;
  elevation_gain?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  avg_pace?: string;
  avg_speed?: number;
  calories?: number;
  source?: string;
  external_id?: string;
  gpx_data?: string;
  notes?: string;
  difficulty_rating?: number; // 1-10
  feeling_rating?: number; // 1-10
  athlete_notes?: string;
  created_at: string;
  updated_at?: string;
  athlete_name?: string;
}
