/**
 * Service de calcul de charge d'entraînement scientifique
 * Basé sur les méthodes validées : TRIMP, Session RPE, ACWR, Monotonie, Strain
 */

export interface WeeklyLoad {
  week: string;
  combinedLoad: number;
}

export interface Anomaly {
  type: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  value?: string;
  details?: string;
}

export interface TrainingMetrics {
  trimp: number;
  sessionRPE: number;
  combinedLoad: number;
}

export class TrainingLoadService {
  /**
   * Calcule le TRIMP (Training Impulse) - Méthode Banister 1991
   * @param duration Durée en minutes
   * @param avgHR Fréquence cardiaque moyenne
   * @param maxHR Fréquence cardiaque maximale
   * @param restingHR Fréquence cardiaque au repos
   */
  calculateTRIMP(
    duration: number,
    avgHR: number,
    maxHR: number = 190,
    restingHR: number = 60
  ): number {
    if (!avgHR || avgHR === 0 || duration === 0) return 0;

    // Calcul de la réserve de fréquence cardiaque (HRR)
    const hrReserve = maxHR - restingHR;
    const hrPercentage = (avgHR - restingHR) / hrReserve;

    // Facteur de pondération selon la zone d'intensité
    let intensityFactor = 1.0;
    if (hrPercentage >= 0.85) intensityFactor = 2.5; // Zone très intense
    else if (hrPercentage >= 0.7) intensityFactor = 2.0; // Zone intense
    else if (hrPercentage >= 0.5) intensityFactor = 1.5; // Zone modérée
    else intensityFactor = 1.0; // Zone légère

    return duration * hrPercentage * intensityFactor;
  }

  /**
   * Calcule le Session RPE (Rate of Perceived Exertion) - Méthode Foster 2001
   * @param duration Durée en minutes
   * @param perceivedEffort Effort perçu (1-10)
   */
  calculateSessionRPE(duration: number, perceivedEffort: number = 5): number {
    return duration * perceivedEffort;
  }

  /**
   * Calcule la charge combinée (moyenne TRIMP + Session RPE)
   */
  calculateCombinedLoad(trimp: number, sessionRPE: number): number {
    return (trimp + sessionRPE) / 2;
  }

  /**
   * Calcule l'ACWR (Acute:Chronic Workload Ratio) - Méthode Gabbett 2016
   * @param weeklyLoads Tableau des charges hebdomadaires (ordre décroissant: semaine courante en premier)
   * @returns ACWR et niveau de risque
   */
  calculateACWR(weeklyLoads: number[]): { acwr: number; risk: 'low' | 'optimal' | 'high' | 'very_high' } {
    if (weeklyLoads.length < 4) {
      return { acwr: 0, risk: 'optimal' };
    }

    const acuteLoad = weeklyLoads[0]; // Dernière semaine
    const chronicLoad = weeklyLoads.slice(0, 4).reduce((a, b) => a + b, 0) / 4; // Moyenne 4 semaines

    if (chronicLoad === 0) {
      return { acwr: 0, risk: 'optimal' };
    }

    const acwr = acuteLoad / chronicLoad;

    // Classification selon Gabbett (2016)
    let risk: 'low' | 'optimal' | 'high' | 'very_high' = 'optimal';
    if (acwr > 1.5) risk = 'very_high'; // Risque blessure ×2-4
    else if (acwr > 1.3) risk = 'high';
    else if (acwr < 0.8 && acuteLoad > 0) risk = 'low'; // Déconditionnement

    return { acwr, risk };
  }

  /**
   * Calcule la Monotonie (Foster 1998)
   * Monotonie = Charge moyenne / Écart-type
   */
  calculateMonotony(weeklyLoads: number[]): number {
    if (weeklyLoads.length < 4) return 0;

    const avgLoad = weeklyLoads.reduce((a, b) => a + b, 0) / weeklyLoads.length;
    const variance = weeklyLoads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / weeklyLoads.length;
    const stdDev = Math.sqrt(variance);

    if (avgLoad === 0 || stdDev === 0) return 0;

    return avgLoad / stdDev;
  }

  /**
   * Calcule le Strain (Contrainte d'entraînement) - Foster 1998
   * Strain = Charge totale × Monotonie
   */
  calculateStrain(weeklyLoads: number[]): number {
    if (weeklyLoads.length < 4) return 0;

    const totalLoad = weeklyLoads.reduce((a, b) => a + b, 0);
    const monotony = this.calculateMonotony(weeklyLoads);

    return totalLoad * monotony;
  }

  /**
   * Détecte les anomalies d'entraînement
   * @param weeklyLoads Charges hebdomadaires
   * @param recentActivities Activités récentes pour vérifications supplémentaires
   */
  detectAnomalies(
    weeklyLoads: number[],
    recentActivities: any[] = []
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // 1. ACWR - Risque de blessure
    const { acwr, risk } = this.calculateACWR(weeklyLoads);
    if (risk === 'very_high') {
      anomalies.push({
        type: 'high_acwr',
        severity: 'danger',
        message: 'Ratio charge aiguë/chronique élevé - Risque de blessure augmenté',
        value: acwr.toFixed(2),
        details: `ACWR: ${acwr.toFixed(2)} (recommandé: 0.8-1.3)`
      });
    } else if (risk === 'high') {
      anomalies.push({
        type: 'moderate_acwr',
        severity: 'warning',
        message: 'Augmentation de charge à surveiller',
        value: acwr.toFixed(2),
        details: `ACWR: ${acwr.toFixed(2)} (optimal: 0.8-1.3)`
      });
    } else if (risk === 'low') {
      anomalies.push({
        type: 'low_acwr',
        severity: 'info',
        message: 'Charge réduite - Risque de déconditionnement',
        value: acwr.toFixed(2),
        details: `ACWR: ${acwr.toFixed(2)} (augmentation possible)`
      });
    }

    // 2. Monotonie - Risque de surentraînement
    const monotony = this.calculateMonotony(weeklyLoads);
    if (monotony > 2.0) {
      anomalies.push({
        type: 'high_monotony',
        severity: 'danger',
        message: 'Monotonie excessive - Risque élevé de surentraînement',
        value: monotony.toFixed(2),
        details: 'Variez l\'intensité et le volume des séances'
      });
    } else if (monotony > 1.5) {
      anomalies.push({
        type: 'moderate_monotony',
        severity: 'warning',
        message: 'Monotonie élevée détectée',
        value: monotony.toFixed(2),
        details: 'Ajouter de la variété dans l\'entraînement'
      });
    }

    // 3. Strain - Contrainte excessive
    const strain = this.calculateStrain(weeklyLoads);
    if (strain > 6000) {
      anomalies.push({
        type: 'high_strain',
        severity: 'danger',
        message: 'Contrainte d\'entraînement excessive',
        value: strain.toFixed(0),
        details: 'Risque de surentraînement - Réduction recommandée'
      });
    }

    // 4. Inactivité (si données fournies)
    if (recentActivities.length > 0) {
      const lastActivity = recentActivities[0];
      const daysSinceLastActivity = lastActivity 
        ? (Date.now() - new Date(lastActivity.date).getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSinceLastActivity > 7) {
        anomalies.push({
          type: 'inactivity',
          severity: 'warning',
          message: 'Aucune activité enregistrée depuis plus de 7 jours'
        });
      }

      // 5. Fréquence cardiaque élevée récurrente
      const recentHighHR = recentActivities.filter((a: any) => 
        a.avg_heart_rate && a.avg_heart_rate > 170
      );

      if (recentHighHR.length >= 3) {
        anomalies.push({
          type: 'high_hr_frequency',
          severity: 'info',
          message: `${recentHighHR.length} séances récentes avec FC moyenne > 170 bpm`
        });
      }
    }

    return anomalies;
  }
}

// Instance singleton
export const trainingLoadService = new TrainingLoadService();
