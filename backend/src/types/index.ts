export interface User {
  id: string;
  email: string;
  name: string;
  role: 'coach' | 'athlete';
  createdAt: Date;
}

export interface Athlete {
  id: string;
  userId: string;
  coachId: string;
  age: number;
  level: string;
  goals: string;
}

export interface TrainingSession {
  id: string;
  coachId: string;
  athleteId: string;
  title: string;
  description: string;
  type: string;
  distance?: number;
  duration: number;
  intensity: string;
  startDate: Date;
  endDate: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface Performance {
  id: string;
  athleteId: string;
  sessionId: string;
  actualDistance?: number;
  actualDuration: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  notes: string;
  recordedAt: Date;
}

export interface CompletedActivity {
  id: string;
  athlete_id: string;
  activity_type: string;
  title: string;
  start_date: Date;
  duration: number;
  distance?: number;
  elevation_gain?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  avg_pace?: string;
  avg_speed?: number;
  calories?: number;
  source: 'gpx' | 'manual' | 'strava' | 'garmin' | 'suunto' | 'coros' | 'polar' | 'decathlon';
  gpx_data?: string;
  external_id?: string;
  difficulty_rating?: number; // 1-10
  feeling_rating?: number; // 1-10
  athlete_notes?: string;
  created_at: Date;
  updated_at?: Date;
}
