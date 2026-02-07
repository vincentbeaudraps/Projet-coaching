import client from '../database/connection.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export class AthleteService {
  /**
   * Récupère l'ID athlète à partir de l'ID utilisateur
   * Remplace 30+ occurrences du même code
   */
  async getAthleteIdFromUserId(userId: string): Promise<string> {
    const result = await client.query(
      'SELECT id FROM athletes WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Athlete profile not found');
    }

    return result.rows[0].id;
  }

  /**
   * Récupère le profil complet d'un athlète
   */
  async getAthleteProfile(athleteId: string) {
    const result = await client.query(
      `SELECT a.*, u.email as user_email, u.name as user_name 
       FROM athletes a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = $1`,
      [athleteId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Athlete not found');
    }

    return result.rows[0];
  }

  /**
   * Vérifie qu'un athlète appartient à un coach
   * Remplace ~15 occurrences
   */
  async verifyCoachOwnership(athleteId: string, coachId: string): Promise<void> {
    const result = await client.query(
      'SELECT id FROM athletes WHERE id = $1 AND coach_id = $2',
      [athleteId, coachId]
    );

    if (result.rows.length === 0) {
      throw new ForbiddenError('Athlete not found or unauthorized');
    }
  }

  /**
   * Vérifie qu'un utilisateur peut accéder aux données d'un athlète
   * (soit c'est son coach, soit c'est lui-même)
   */
  async verifyAccess(athleteId: string, userId: string, userRole: string): Promise<void> {
    const result = await client.query(
      'SELECT coach_id, user_id FROM athletes WHERE id = $1',
      [athleteId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Athlete not found');
    }

    const { coach_id, user_id } = result.rows[0];
    const isCoach = userRole === 'coach' && coach_id === userId;
    const isOwnProfile = userRole === 'athlete' && user_id === userId;

    if (!isCoach && !isOwnProfile) {
      throw new ForbiddenError('Unauthorized to access this athlete data');
    }
  }

  /**
   * Récupère tous les athlètes d'un coach
   */
  async getAthletesByCoach(coachId: string) {
    const result = await client.query(
      `SELECT a.*, u.email as user_email, u.name as user_name 
       FROM athletes a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.coach_id = $1
       ORDER BY a.created_at DESC`,
      [coachId]
    );

    return result.rows;
  }

  /**
   * Vérifie si un utilisateur existe déjà
   */
  async checkUserExists(email: string): Promise<boolean> {
    const result = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0;
  }

  /**
   * Récupère les métriques d'un athlète (FC max, FC repos, VMA)
   */
  async getAthleteMetrics(athleteId: string) {
    const result = await client.query(
      'SELECT max_heart_rate, resting_heart_rate, vma, vo2max, weight FROM athletes WHERE id = $1',
      [athleteId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Athlete not found');
    }

    return result.rows[0];
  }
}

// Instance singleton pour réutilisation
export const athleteService = new AthleteService();
