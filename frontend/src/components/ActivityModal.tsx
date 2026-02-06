import { useState, useMemo, useEffect } from 'react';
import { CompletedActivity, Athlete } from '../types';
import { athletesService } from '../services/api';
import ZoneDistribution from './ZoneDistribution';
import '../styles/ActivityModal.css';

interface ActivityModalProps {
  activity: CompletedActivity;
  onClose: () => void;
  onSave: (updatedActivity: Partial<CompletedActivity>) => Promise<void>;
  onDelete: () => Promise<void>;
}

interface Split {
  km: number;
  time: string;
  pace: string;
  avgHr?: number;
}

export default function ActivityModal({ activity, onClose, onSave, onDelete }: ActivityModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [formData, setFormData] = useState({
    title: activity.title || '',
    difficulty_rating: activity.difficulty_rating || 0,
    feeling_rating: activity.feeling_rating || 0,
    athlete_notes: activity.athlete_notes || '',
  });

  // Charger les données de l'athlète pour obtenir ses métriques
  useEffect(() => {
    const loadAthleteMetrics = async () => {
      try {
        const response = await athletesService.getById(activity.athlete_id);
        setAthlete(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des métriques:', error);
      }
    };
    
    loadAthleteMetrics();
  }, [activity.athlete_id]);

  // Helper functions - MUST be declared before useMemo that uses them
  const parsePace = (pace: string): number => {
    const [min, sec] = pace.split(':').map(Number);
    return min * 60 + sec;
  };

  const formatPaceFromSeconds = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs.toString().padStart(2, '0')}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      running: '🏃',
      cycling: '🚴',
      swimming: '🏊',
      walking: '🚶',
      hiking: '🥾',
      strength: '💪',
      yoga: '🧘',
    };
    return icons[type] || '🏃';
  };

  const getRatingEmoji = (rating: number) => {
    if (rating === 0) return '⚪';
    if (rating <= 2) return '😣';
    if (rating <= 4) return '😕';
    if (rating <= 6) return '😐';
    if (rating <= 8) return '🙂';
    return '😄';
  };

  // Generate mock splits data (in real implementation, this would come from GPX data)
  const splits = useMemo<Split[]>(() => {
    if (!activity.distance) return [];
    
    const numKm = Math.floor(activity.distance);
    const avgPaceSeconds = activity.avg_pace ? parsePace(activity.avg_pace) : 0;
    
    return Array.from({ length: numKm }, (_, i) => {
      // Add some variation to make it realistic
      const variation = (Math.random() - 0.5) * 20; // ±10 seconds
      const paceSeconds = avgPaceSeconds + variation;
      const hrVariation = Math.floor((Math.random() - 0.5) * 10);
      
      return {
        km: i + 1,
        time: formatDuration((i + 1) * paceSeconds),
        pace: formatPaceFromSeconds(paceSeconds),
        avgHr: activity.avg_heart_rate ? activity.avg_heart_rate + hrVariation : undefined,
      };
    });
  }, [activity.distance, activity.avg_pace, activity.avg_heart_rate]);

  // Calculate training zones (based on heart rate) - Removed, now using ZoneDistribution component

  const handleSave = async () => {
    try {
      await onSave({
        title: formData.title,
        difficulty_rating: formData.difficulty_rating || undefined,
        feeling_rating: formData.feeling_rating || undefined,
        athlete_notes: formData.athlete_notes || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      setIsDeleting(true);
      try {
        await onDelete();
        onClose();
      } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Erreur lors de la suppression');
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="activity-modal-rich" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="activity-title-section">
            <span className="activity-icon-large">{getActivityIcon(activity.activity_type)}</span>
            {isEditing ? (
              <input
                type="text"
                className="title-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de l'activité"
              />
            ) : (
              <h2>{activity.title}</h2>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Left Column - Main Stats & Charts */}
          <div className="left-column">
            {/* Primary Stats Row */}
            <div className="stats-row-primary">
              <div className="stat-card-large">
                <span className="stat-label">Distance</span>
                <span className="stat-value-large">{activity.distance ? Number(activity.distance).toFixed(2) : '0.00'}</span>
                <span className="stat-unit">km</span>
              </div>
              <div className="stat-card-large">
                <span className="stat-label">Durée</span>
                <span className="stat-value-large">{formatDuration(activity.duration)}</span>
              </div>
              <div className="stat-card-large">
                <span className="stat-label">Allure moy.</span>
                <span className="stat-value-large">{activity.avg_pace || '--:--'}</span>
                <span className="stat-unit">/km</span>
              </div>
              {activity.elevation_gain && (
                <div className="stat-card-large">
                  <span className="stat-label">
                    D+
                    {activity.source === 'gpx' && (
                      <span 
                        className="gps-indicator-inline"
                        data-tooltip="Données GPS - Moins précis que baromètre"
                      />
                    )}
                  </span>
                  <span className="stat-value-large">{Number(activity.elevation_gain).toFixed(0)}</span>
                  <span className="stat-unit">m</span>
                </div>
              )}
            </div>

            {/* Zone Distribution Analysis */}
            <div className="zone-analysis-section">
              <h3 className="section-title">Analyse des zones d'entraînement</h3>
              <ZoneDistribution
                avgHeartRate={activity.avg_heart_rate}
                maxHeartRate={activity.max_heart_rate}
                avgSpeed={activity.avg_speed}
                duration={activity.duration / 60} // Convertir secondes en minutes
                gpxData={activity.gpx_data}
                athleteFcMax={athlete?.max_heart_rate}
                athleteVMA={athlete?.vma}
              />
            </div>

            {/* Pace Chart */}
            {splits.length > 0 && (
              <div className="chart-card">
                <h3 className="chart-title">📊 Allure par kilomètre</h3>
                <div className="pace-chart">
                  {splits.map((split) => {
                    const paceSeconds = parsePace(split.pace);
                    const avgPaceSeconds = activity.avg_pace ? parsePace(activity.avg_pace) : paceSeconds;
                    const heightPercent = Math.min((paceSeconds / avgPaceSeconds) * 100, 150);
                    const isFaster = paceSeconds < avgPaceSeconds;
                    
                    return (
                      <div key={split.km} className="pace-bar-wrapper">
                        <div 
                          className={`pace-bar ${isFaster ? 'faster' : 'slower'}`}
                          style={{ height: `${heightPercent}%` }}
                          title={`Km ${split.km}: ${split.pace}/km`}
                        >
                          <span className="pace-bar-label">{split.pace}</span>
                        </div>
                        <span className="pace-bar-km">Km{split.km}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Splits Table */}
            {splits.length > 0 && (
              <div className="splits-card">
                <h3 className="splits-title">🏃 Temps de passage</h3>
                <div className="splits-table">
                  <div className="splits-header">
                    <span>Km</span>
                    <span>Temps</span>
                    <span>Allure</span>
                    {splits[0].avgHr && <span>FC moy.</span>}
                  </div>
                  {splits.map((split) => (
                    <div key={split.km} className="split-row">
                      <span className="split-km">{split.km}</span>
                      <span className="split-time">{split.time}</span>
                      <span className="split-pace">{split.pace}/km</span>
                      {split.avgHr && <span className="split-hr">{split.avgHr} bpm</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Feedback & Notes */}
          <div className="right-column">
            <div className="feedback-card">
              <h3 className="feedback-title">📝 Feedback</h3>
              
              <div className="rating-group">
                <label>
                  <span className="rating-label">
                    Difficulté ressentie {getRatingEmoji(formData.difficulty_rating)}
                  </span>
                  {isEditing ? (
                    <div className="rating-input">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={formData.difficulty_rating}
                        onChange={(e) => setFormData({ ...formData, difficulty_rating: parseInt(e.target.value) })}
                        className="rating-slider"
                      />
                      <span className="rating-value">
                        {formData.difficulty_rating === 0 ? 'Non défini' : `${formData.difficulty_rating}/10`}
                      </span>
                    </div>
                  ) : (
                    <span className="rating-display">
                      {activity.difficulty_rating ? `${activity.difficulty_rating}/10` : 'Non renseigné'}
                    </span>
                  )}
                </label>
              </div>

              <div className="rating-group">
                <label>
                  <span className="rating-label">
                    Sensations / Forme {getRatingEmoji(formData.feeling_rating)}
                  </span>
                  {isEditing ? (
                    <div className="rating-input">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={formData.feeling_rating}
                        onChange={(e) => setFormData({ ...formData, feeling_rating: parseInt(e.target.value) })}
                        className="rating-slider"
                      />
                      <span className="rating-value">
                        {formData.feeling_rating === 0 ? 'Non défini' : `${formData.feeling_rating}/10`}
                      </span>
                    </div>
                  ) : (
                    <span className="rating-display">
                      {activity.feeling_rating ? `${activity.feeling_rating}/10` : 'Non renseigné'}
                    </span>
                  )}
                </label>
              </div>

              <div className="notes-group">
                <label>
                  <span className="notes-label">💭 Notes / Commentaires</span>
                  {isEditing ? (
                    <textarea
                      className="notes-textarea"
                      value={formData.athlete_notes}
                      onChange={(e) => setFormData({ ...formData, athlete_notes: e.target.value })}
                      placeholder="Comment s'est passée la séance ? Douleurs, fatigue, motivation, etc."
                      rows={8}
                    />
                  ) : (
                    <div className="notes-display">
                      {activity.athlete_notes || 'Aucun commentaire'}
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Activity Details */}
            <div className="details-card">
              <h3 className="details-title">ℹ️ Détails</h3>
              <div className="detail-item">
                <span className="detail-label">📅 Date</span>
                <span className="detail-value">{formatDate(activity.start_date)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">🏃 Type</span>
                <span className="detail-value">{activity.activity_type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">📱 Source</span>
                <span className="detail-value">{activity.source === 'gpx' ? 'Fichier GPX' : 'Manuel'}</span>
              </div>
              {activity.max_heart_rate && (
                <div className="detail-item">
                  <span className="detail-label">❤️ FC max</span>
                  <span className="detail-value">{activity.max_heart_rate} bpm</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          {isEditing ? (
            <>
              <button className="btn btn-cancel" onClick={() => {
                setIsEditing(false);
                setFormData({
                  title: activity.title || '',
                  difficulty_rating: activity.difficulty_rating || 0,
                  feeling_rating: activity.feeling_rating || 0,
                  athlete_notes: activity.athlete_notes || '',
                });
              }}>
                Annuler
              </button>
              <button className="btn btn-save" onClick={handleSave}>
                💾 Enregistrer
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-delete" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '⏳ Suppression...' : '🗑️ Supprimer'}
              </button>
              <button className="btn btn-edit" onClick={() => setIsEditing(true)}>
                ✏️ Modifier
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
