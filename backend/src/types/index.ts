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
