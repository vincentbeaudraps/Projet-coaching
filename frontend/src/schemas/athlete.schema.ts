/**
 * Athlete Validation Schemas using Zod
 * 
 * Validates athlete data and physiological metrics
 */

import { z } from 'zod';

/**
 * Athlete creation schema
 */
export const athleteSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .min(5, 'Email trop court')
    .max(100, 'Email trop long'),
  firstName: z.string()
    .min(2, 'Prénom trop court (minimum 2 caractères)')
    .max(50, 'Prénom trop long (maximum 50 caractères)')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Prénom invalide (lettres uniquement)'),
  lastName: z.string()
    .min(2, 'Nom trop court (minimum 2 caractères)')
    .max(50, 'Nom trop long (maximum 50 caractères)')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Nom invalide (lettres uniquement)'),
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .refine(
      (date) => {
        const birthDate = new Date(date);
        const age = (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return age >= 10 && age <= 100;
      },
      { message: 'Âge invalide (doit être entre 10 et 100 ans)' }
    ),
  password: z.string()
    .min(8, 'Mot de passe trop court (minimum 8 caractères)')
    .max(100, 'Mot de passe trop long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Mot de passe doit contenir au moins 1 majuscule, 1 minuscule et 1 chiffre'
    )
    .optional(),
});

/**
 * Athlete metrics schema (physiological data)
 */
export const athleteMetricsSchema = z.object({
  vma: z.number()
    .min(10, 'VMA trop faible (minimum 10 km/h)')
    .max(30, 'VMA trop élevée (maximum 30 km/h)')
    .optional(),
  maxHeartRate: z.number()
    .min(120, 'FC Max trop faible (minimum 120 bpm)')
    .max(220, 'FC Max trop élevée (maximum 220 bpm)')
    .optional(),
  restingHeartRate: z.number()
    .min(30, 'FC repos trop faible (minimum 30 bpm)')
    .max(100, 'FC repos trop élevée (maximum 100 bpm)')
    .optional(),
  weight: z.number()
    .min(30, 'Poids trop faible (minimum 30 kg)')
    .max(200, 'Poids trop élevé (maximum 200 kg)')
    .optional(),
  height: z.number()
    .min(100, 'Taille trop faible (minimum 100 cm)')
    .max(250, 'Taille trop élevée (maximum 250 cm)')
    .optional(),
}).refine(
  (data) => {
    // Si FC Max et FC repos sont renseignées, vérifier la cohérence
    if (data.maxHeartRate && data.restingHeartRate) {
      return data.maxHeartRate > data.restingHeartRate + 50;
    }
    return true;
  },
  {
    message: 'FC Max doit être au moins 50 bpm supérieure à la FC repos',
    path: ['maxHeartRate'],
  }
);

/**
 * Athlete update schema (all fields optional)
 */
export const athleteUpdateSchema = athleteSchema.partial().extend({
  metrics: athleteMetricsSchema.optional(),
});

/**
 * Type inference
 */
export type Athlete = z.infer<typeof athleteSchema>;
export type AthleteMetrics = z.infer<typeof athleteMetricsSchema>;
export type AthleteUpdate = z.infer<typeof athleteUpdateSchema>;

/**
 * Validation helper
 */
export function validateAthlete(data: unknown) {
  try {
    return {
      success: true as const,
      data: athleteSchema.parse(data),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        errors: error.issues.map((err: z.ZodIssue) => ({
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

/**
 * Metrics validation helper
 */
export function validateMetrics(data: unknown) {
  try {
    return {
      success: true as const,
      data: athleteMetricsSchema.parse(data),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        errors: error.issues.map((err: z.ZodIssue) => ({
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
