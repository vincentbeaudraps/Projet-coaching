/**
 * Tests for Session Validation Schema
 */

import { describe, it, expect } from 'vitest';
import { sessionSchema, blockSchema, validateSession } from '../session.schema';

describe('Session Schema Validation', () => {
  describe('blockSchema', () => {
    it('should validate a valid block', () => {
      const validBlock = {
        id: '123',
        type: 'warmup',
        duration: 15,
        intensity: 'easy',
        description: 'Échauffement progressif',
      };

      const result = blockSchema.safeParse(validBlock);
      expect(result.success).toBe(true);
    });

    it('should reject block with invalid duration', () => {
      const invalidBlock = {
        id: '123',
        type: 'warmup',
        duration: 0, // Invalid: minimum is 1
        intensity: 'easy',
      };

      const result = blockSchema.safeParse(invalidBlock);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Durée minimum : 1 minute');
      }
    });

    it('should reject block with duration too long', () => {
      const invalidBlock = {
        id: '123',
        type: 'warmup',
        duration: 400, // Invalid: maximum is 300
        intensity: 'easy',
      };

      const result = blockSchema.safeParse(invalidBlock);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Durée maximum : 300 minutes');
      }
    });

    it('should validate block with optional fields', () => {
      const blockWithOptionals = {
        id: '123',
        type: 'interval',
        duration: 3,
        intensity: 'vo2max',
        repetitions: 8,
        recoveryTime: 2,
        paceMin: 225,
        paceMax: 235,
        hrMin: 180,
        hrMax: 190,
      };

      const result = blockSchema.safeParse(blockWithOptionals);
      expect(result.success).toBe(true);
    });

    it('should reject invalid intensity', () => {
      const invalidBlock = {
        id: '123',
        type: 'warmup',
        duration: 15,
        intensity: 'super_fast', // Invalid
      };

      const result = blockSchema.safeParse(invalidBlock);
      expect(result.success).toBe(false);
    });
  });

  describe('sessionSchema', () => {
    it('should validate a complete valid session', () => {
      const validSession = {
        title: 'Séance VMA',
        athleteId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2026-02-10'),
        sessionType: 'run',
        blocks: [
          {
            id: '1',
            type: 'warmup',
            duration: 15,
            intensity: 'easy',
            description: 'Échauffement',
          },
          {
            id: '2',
            type: 'interval',
            duration: 3,
            intensity: 'vo2max',
            repetitions: 8,
            recoveryTime: 2,
          },
        ],
        notes: 'Séance importante',
      };

      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should reject session with title too short', () => {
      const invalidSession = {
        title: 'VM', // Too short
        athleteId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2026-02-10'),
        blocks: [
          {
            id: '1',
            type: 'warmup',
            duration: 15,
            intensity: 'easy',
          },
        ],
      };

      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Titre trop court');
      }
    });

    it('should reject session with invalid UUID', () => {
      const invalidSession = {
        title: 'Séance VMA',
        athleteId: 'not-a-uuid', // Invalid
        date: new Date('2026-02-10'),
        blocks: [
          {
            id: '1',
            type: 'warmup',
            duration: 15,
            intensity: 'easy',
          },
        ],
      };

      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ID athlète invalide');
      }
    });

    it('should reject session with no blocks', () => {
      const invalidSession = {
        title: 'Séance VMA',
        athleteId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2026-02-10'),
        blocks: [], // Empty
      };

      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Au moins 1 bloc');
      }
    });

    it('should reject session with too many blocks', () => {
      const invalidSession = {
        title: 'Séance VMA',
        athleteId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2026-02-10'),
        blocks: Array(25).fill({
          id: '1',
          type: 'warmup',
          duration: 15,
          intensity: 'easy',
        }), // Too many
      };

      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum 20 blocs');
      }
    });

    it('should reject session with total duration too long', () => {
      const invalidSession = {
        title: 'Séance ultra longue',
        athleteId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2026-02-10'),
        blocks: [
          {
            id: '1',
            type: 'endurance',
            duration: 300, // 5 heures
            intensity: 'easy',
          },
          {
            id: '2',
            type: 'endurance',
            duration: 120, // 2 heures = 7h total
            intensity: 'easy',
          },
        ],
      };

      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((e: any) => e.message.includes('Durée totale'))).toBe(true);
      }
    });

    it('should reject session with date too old', () => {
      const invalidSession = {
        title: 'Séance passée',
        athleteId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2019-01-01'), // Too old
        blocks: [
          {
            id: '1',
            type: 'warmup',
            duration: 15,
            intensity: 'easy',
          },
        ],
      };

      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Date trop ancienne');
      }
    });
  });

  describe('validateSession helper', () => {
    it('should return success for valid data', () => {
      const validData = {
        title: 'Séance test',
        athleteId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2026-02-10'),
        blocks: [
          {
            id: '1',
            type: 'warmup',
            duration: 15,
            intensity: 'easy',
          },
        ],
      };

      const result = validateSession(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Séance test');
      }
    });

    it('should return formatted errors for invalid data', () => {
      const invalidData = {
        title: 'VMA',
        athleteId: 'invalid',
        date: new Date('2026-02-10'),
        blocks: [],
      };

      const result = validateSession(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toHaveProperty('field');
        expect(result.errors[0]).toHaveProperty('message');
      }
    });
  });
});
