// Validation schemas for API routes
import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Email invalide').max(255),
  name: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  password: z.string().min(8, 'Mot de passe trop court (minimum 8 caractères)').max(100),
  invitationCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

// Athlete schemas
export const createAthleteSchema = z.object({
  email: z.string().email('Email invalide').max(255),
  name: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  age: z.number().int().min(10, 'Âge minimum: 10 ans').max(100, 'Âge maximum: 100 ans').optional(),
  level: z.enum(['Débutant', 'Intermédiaire', 'Avancé', 'Expert']).optional(),
  goals: z.string().max(500, 'Objectifs trop longs').optional(),
});

export const updateAthleteSchema = z.object({
  age: z.number().int().min(10).max(100).optional(),
  level: z.enum(['Débutant', 'Intermédiaire', 'Avancé', 'Expert']).optional(),
  goals: z.string().max(500).optional(),
});

export const athleteMetricsSchema = z.object({
  max_heart_rate: z.number().int().min(100).max(250).optional(),
  resting_heart_rate: z.number().int().min(30).max(100).optional(),
  vma: z.number().min(8).max(30).optional(),
  vo2max: z.number().min(20).max(100).optional(),
  weight: z.number().min(30).max(200).optional(),
  lactate_threshold_pace: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
});

// Session schemas
export const createSessionSchema = z.object({
  athlete_id: z.string().uuid('ID athlète invalide'),
  start_date: z.string().datetime('Date invalide'),
  type: z.enum(['Endurance', 'Interval', 'Tempo', 'Recovery', 'Long Run', 'Race', 'Custom']),
  description: z.string().max(1000).optional(),
  blocks: z.array(z.object({
    type: z.enum(['warmup', 'work', 'recovery', 'cooldown']),
    duration_minutes: z.number().min(1).max(300),
    intensity: z.enum(['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Recovery', 'Easy', 'Moderate', 'Hard', 'VeryHard']),
    description: z.string().max(200).optional(),
  })).min(1, 'Au moins un bloc requis'),
  target_distance: z.number().min(0).max(200).optional(),
  target_duration: z.number().min(0).max(500).optional(),
  notes: z.string().max(1000).optional(),
});

// Activity schemas
export const createActivitySchema = z.object({
  athlete_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
  activity_date: z.string().datetime(),
  distance: z.number().min(0).max(200),
  duration_minutes: z.number().min(0).max(500),
  avg_heart_rate: z.number().int().min(50).max(250).optional(),
  max_heart_rate: z.number().int().min(50).max(250).optional(),
  avg_pace: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  elevation_gain: z.number().min(0).max(10000).optional(),
  notes: z.string().max(1000).optional(),
  feeling: z.enum(['Excellent', 'Bien', 'Moyen', 'Difficile', 'Très difficile']).optional(),
  route_name: z.string().max(100).optional(),
});

// Message schemas
export const sendMessageSchema = z.object({
  receiverId: z.string().uuid('ID destinataire invalide'),
  content: z.string().min(1, 'Message vide').max(2000, 'Message trop long'),
});

// Performance schemas
export const recordPerformanceSchema = z.object({
  athlete_id: z.string().uuid(),
  metric_type: z.enum(['vo2max', 'lactate_threshold', 'vma', 'weight', 'resting_hr']),
  value: z.number().min(0),
  recorded_date: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

// Personal record schemas
export const createRecordSchema = z.object({
  distance: z.string().max(50),
  time: z.string().regex(/^\d{1,2}:\d{2}:\d{2}$/, 'Format: HH:MM:SS'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  race_name: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

// Race schemas
export const createRaceSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  distance: z.string().max(50),
  location: z.string().max(200).optional(),
  target_time: z.string().regex(/^\d{1,2}:\d{2}:\d{2}$/, 'Format: HH:MM:SS').optional(),
  notes: z.string().max(500).optional(),
});

// Annual volume schemas
export const createVolumeSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  volume_km: z.number().min(0).max(50000),
  notes: z.string().max(500).optional(),
});

// Invitation schemas
export const validateInvitationSchema = z.object({
  code: z.string().length(8, 'Code invalide'),
});

// Feedback schemas
export const createFeedbackSchema = z.object({
  session_id: z.string().uuid(),
  feeling: z.enum(['Excellent', 'Bien', 'Moyen', 'Difficile', 'Très difficile']),
  comments: z.string().max(1000).optional(),
  difficulty: z.number().int().min(1).max(10),
});

// Helper function to validate request body
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Validation error: ${messages}`);
    }
    throw error;
  }
}
