/**
 * Session Validation Schemas using Zod
 * 
 * These schemas ensure data integrity for training sessions
 * and provide user-friendly error messages in French.
 */

import { z } from 'zod';

/**
 * Training block schema - Represents a single exercise block
 */
export const blockSchema = z.object({
  id: z.string().min(1, 'ID du bloc requis'),
  type: z.enum(['warmup', 'work', 'cooldown', 'interval', 'tempo', 'endurance']),
  duration: z.number()
    .min(1, 'Durée minimum : 1 minute')
    .max(300, 'Durée maximum : 300 minutes')
    .optional(),
  distance: z.number()
    .min(0, 'Distance ne peut pas être négative')
    .max(200, 'Distance maximum : 200 km')
    .optional(),
  intensity: z.enum([
    'recovery', 'easy', 'moderate', 'threshold', 'tempo', 'vo2max', 'sprint'
  ]),
  description: z.string()
    .max(500, 'Description trop longue (max 500 caractères)')
    .optional()
    .default(''),
  repetitions: z.number()
    .min(1, 'Au moins 1 répétition')
    .max(50, 'Maximum 50 répétitions')
    .optional(),
  recoveryTime: z.number()
    .min(0, 'Temps de récupération ne peut pas être négatif')
    .max(30, 'Temps de récupération maximum : 30 minutes')
    .optional(),
  paceMode: z.enum(['fixed', 'zone', 'vma_percent']).optional(),
  paceMin: z.number().min(120).max(900).optional(), // 2:00/km to 15:00/km
  paceMax: z.number().min(120).max(900).optional(),
  paceZone: z.number().min(1).max(6).optional(),
  vmaPercentMin: z.number().min(50).max(120).optional(),
  vmaPercentMax: z.number().min(50).max(120).optional(),
  hrMode: z.enum(['fixed', 'zone']).optional(),
  hrMin: z.number().min(40).max(220).optional(),
  hrMax: z.number().min(40).max(220).optional(),
  hrZone: z.number().min(1).max(5).optional(),
});

/**
 * Training session schema - Complete session with metadata
 */
export const sessionSchema = z.object({
  title: z.string()
    .min(3, 'Titre trop court (minimum 3 caractères)')
    .max(100, 'Titre trop long (maximum 100 caractères)'),
  athleteId: z.string()
    .uuid('ID athlète invalide'),
  date: z.date()
    .min(new Date('2020-01-01'), 'Date trop ancienne')
    .max(new Date('2030-12-31'), 'Date trop lointaine'),
  sessionType: z.enum(['run', 'trail', 'recovery']).default('run'),
  blocks: z.array(blockSchema)
    .min(1, 'Au moins 1 bloc d\'entraînement requis')
    .max(20, 'Maximum 20 blocs par séance'),
  notes: z.string()
    .max(2000, 'Notes trop longues (maximum 2000 caractères)')
    .optional()
    .default(''),
}).refine(
  (data) => {
    // Vérifier que la durée totale est raisonnable
    const totalDuration = data.blocks.reduce((sum, block) => {
      const blockDuration = block.duration || 0;
      const reps = block.repetitions || 1;
      const recovery = block.recoveryTime || 0;
      return sum + (blockDuration * reps) + (recovery * (reps - 1));
    }, 0);
    return totalDuration <= 360; // Max 6 heures
  },
  {
    message: 'Durée totale de la séance trop longue (maximum 6 heures)',
    path: ['blocks'],
  }
);

/**
 * Session update schema (partial validation)
 * Note: Cannot use .partial() on schemas with refinements
 */
export const sessionUpdateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  athleteId: z.string().uuid().optional(),
  date: z.date().optional(),
  sessionType: z.enum(['run', 'trail', 'recovery']).optional(),
  blocks: z.array(blockSchema).min(1).max(20).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Type inference from schemas
 */
export type SessionBlock = z.infer<typeof blockSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type SessionUpdate = z.infer<typeof sessionUpdateSchema>;

/**
 * Helper function to validate and provide user-friendly errors
 */
export function validateSession(data: unknown) {
  try {
    return {
      success: true as const,
      data: sessionSchema.parse(data),
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as any;
      return {
        success: false as const,
        errors: zodError.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      success: false as const,
      errors: [{ field: 'unknown', message: 'Erreur de validation inconnue' }],
    };
  }
}
