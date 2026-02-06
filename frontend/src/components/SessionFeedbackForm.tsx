import React, { useState, useEffect } from 'react';
import '../styles/SessionFeedbackForm.css';
import { submitFeedback, getSessionFeedback, SessionFeedback } from '../services/feedbackService';

interface SessionFeedbackFormProps {
  sessionId: string;
  sessionTitle: string;
  onClose: () => void;
  onSubmit?: () => void;
}

export const SessionFeedbackForm: React.FC<SessionFeedbackFormProps> = ({
  sessionId,
  sessionTitle,
  onClose,
  onSubmit
}) => {
  const [loading, setLoading] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<SessionFeedback | null>(null);
  const [formData, setFormData] = useState({
    feelingRating: 0,
    difficultyRating: 0,
    fatigueRating: 0,
    athleteNotes: '',
    completedDistance: '',
    completedDuration: '',
    avgHeartRate: '',
    avgPace: ''
  });

  useEffect(() => {
    loadExistingFeedback();
  }, [sessionId]);

  const loadExistingFeedback = async () => {
    try {
      const feedback = await getSessionFeedback(sessionId);
      if (feedback) {
        setExistingFeedback(feedback);
        setFormData({
          feelingRating: feedback.feelingRating || 0,
          difficultyRating: feedback.difficultyRating || 0,
          fatigueRating: feedback.fatigueRating || 0,
          athleteNotes: feedback.athleteNotes || '',
          completedDistance: feedback.completedDistance?.toString() || '',
          completedDuration: feedback.completedDuration?.toString() || '',
          avgHeartRate: feedback.avgHeartRate?.toString() || '',
          avgPace: feedback.avgPace || ''
        });
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const handleRatingClick = (field: 'feelingRating' | 'difficultyRating' | 'fatigueRating', value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.feelingRating === 0 || formData.difficultyRating === 0 || formData.fatigueRating === 0) {
      alert('Veuillez renseigner les 3 notes (ressenti, difficulté, fatigue)');
      return;
    }

    setLoading(true);

    try {
      await submitFeedback({
        sessionId,
        feelingRating: formData.feelingRating,
        difficultyRating: formData.difficultyRating,
        fatigueRating: formData.fatigueRating,
        athleteNotes: formData.athleteNotes || undefined,
        completedDistance: formData.completedDistance ? parseFloat(formData.completedDistance) : undefined,
        completedDuration: formData.completedDuration ? parseInt(formData.completedDuration) : undefined,
        avgHeartRate: formData.avgHeartRate ? parseInt(formData.avgHeartRate) : undefined,
        avgPace: formData.avgPace || undefined
      });

      alert(existingFeedback ? 'Feedback mis à jour !' : 'Feedback envoyé !');
      onSubmit?.();
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Erreur lors de l\'envoi du feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (field: 'feelingRating' | 'difficultyRating' | 'fatigueRating', currentValue: number) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`star ${star <= currentValue ? 'star-filled' : ''}`}
            onClick={() => handleRatingClick(field, star)}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const getRatingLabel = (value: number) => {
    if (value === 0) return '';
    const labels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent'];
    return labels[value - 1];
  };

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={e => e.stopPropagation()}>
        <div className="feedback-header">
          <h2>💬 Retour sur la séance</h2>
          <button className="feedback-close" onClick={onClose}>×</button>
        </div>

        <div className="feedback-session-info">
          <span className="feedback-session-title">{sessionTitle}</span>
          {existingFeedback && (
            <span className="feedback-existing-badge">Déjà rempli</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          {/* Feeling Rating */}
          <div className="feedback-field">
            <label className="feedback-label">
              <span className="feedback-icon">😊</span>
              Ressenti général
              <span className="feedback-rating-value">{getRatingLabel(formData.feelingRating)}</span>
            </label>
            {renderStars('feelingRating', formData.feelingRating)}
            <p className="feedback-help">Comment t'es-tu senti pendant la séance ?</p>
          </div>

          {/* Difficulty Rating */}
          <div className="feedback-field">
            <label className="feedback-label">
              <span className="feedback-icon">💪</span>
              Difficulté perçue
              <span className="feedback-rating-value">{getRatingLabel(formData.difficultyRating)}</span>
            </label>
            {renderStars('difficultyRating', formData.difficultyRating)}
            <p className="feedback-help">Était-ce trop facile, parfait, ou trop dur ?</p>
          </div>

          {/* Fatigue Rating */}
          <div className="feedback-field">
            <label className="feedback-label">
              <span className="feedback-icon">😴</span>
              Niveau de fatigue
              <span className="feedback-rating-value">{getRatingLabel(formData.fatigueRating)}</span>
            </label>
            {renderStars('fatigueRating', formData.fatigueRating)}
            <p className="feedback-help">Quel est ton niveau de fatigue après la séance ?</p>
          </div>

          {/* Performance Data */}
          <div className="feedback-section">
            <h3>📊 Données de performance (optionnel)</h3>
            
            <div className="feedback-row">
              <div className="feedback-field-inline">
                <label>Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="10.5"
                  value={formData.completedDistance}
                  onChange={e => setFormData(prev => ({ ...prev, completedDistance: e.target.value }))}
                />
              </div>

              <div className="feedback-field-inline">
                <label>Durée (min)</label>
                <input
                  type="number"
                  placeholder="45"
                  value={formData.completedDuration}
                  onChange={e => setFormData(prev => ({ ...prev, completedDuration: e.target.value }))}
                />
              </div>
            </div>

            <div className="feedback-row">
              <div className="feedback-field-inline">
                <label>FC moyenne (bpm)</label>
                <input
                  type="number"
                  placeholder="150"
                  value={formData.avgHeartRate}
                  onChange={e => setFormData(prev => ({ ...prev, avgHeartRate: e.target.value }))}
                />
              </div>

              <div className="feedback-field-inline">
                <label>Allure moyenne</label>
                <input
                  type="text"
                  placeholder="5'30/km"
                  value={formData.avgPace}
                  onChange={e => setFormData(prev => ({ ...prev, avgPace: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="feedback-field">
            <label className="feedback-label">
              <span className="feedback-icon">📝</span>
              Notes personnelles
            </label>
            <textarea
              className="feedback-textarea"
              placeholder="Ajoute tes commentaires : conditions météo, sensations, douleurs éventuelles, etc."
              value={formData.athleteNotes}
              onChange={e => setFormData(prev => ({ ...prev, athleteNotes: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Coach Comment (read-only if exists) */}
          {existingFeedback?.coachComment && (
            <div className="feedback-coach-comment">
              <div className="feedback-coach-header">
                <span className="feedback-icon">👨‍🏫</span>
                Commentaire du coach
              </div>
              <p>{existingFeedback.coachComment}</p>
            </div>
          )}

          {/* Submit */}
          <div className="feedback-actions">
            <button type="button" className="feedback-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="feedback-btn-submit" disabled={loading}>
              {loading ? 'Envoi...' : existingFeedback ? 'Mettre à jour' : 'Envoyer le feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionFeedbackForm;
