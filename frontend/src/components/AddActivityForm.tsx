import { useState } from 'react';
import { activitiesService } from '../services/api';
import { Athlete } from '../types/index';

interface AddActivityFormProps {
  athletes: Athlete[];
  onActivityAdded: () => void;
  preselectedAthleteId?: string;
}

function AddActivityForm({ athletes, onActivityAdded, preselectedAthleteId }: AddActivityFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    athleteId: preselectedAthleteId || '',
    activityType: 'running',
    title: '',
    startDate: new Date().toISOString().slice(0, 16),
    duration: '',
    distance: '',
    elevationGain: '',
    avgHeartRate: '',
    maxHeartRate: '',
    avgPace: '',
    calories: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.athleteId || !formData.duration) {
      alert('Veuillez remplir au moins l\'athlète et la durée');
      return;
    }

    setLoading(true);
    try {
      await activitiesService.create({
        athleteId: formData.athleteId,
        activityType: formData.activityType,
        title: formData.title || `${formData.activityType} - ${new Date(formData.startDate).toLocaleDateString('fr-FR')}`,
        startDate: new Date(formData.startDate).toISOString(),
        duration: parseInt(formData.duration),
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        elevationGain: formData.elevationGain ? parseFloat(formData.elevationGain) : undefined,
        avgHeartRate: formData.avgHeartRate ? parseInt(formData.avgHeartRate) : undefined,
        maxHeartRate: formData.maxHeartRate ? parseInt(formData.maxHeartRate) : undefined,
        avgPace: formData.avgPace || undefined,
        calories: formData.calories ? parseInt(formData.calories) : undefined,
        notes: formData.notes || undefined,
      });

      alert('Activité ajoutée avec succès !');
      setShowForm(false);
      setFormData({
        athleteId: preselectedAthleteId || '',
        activityType: 'running',
        title: '',
        startDate: new Date().toISOString().slice(0, 16),
        duration: '',
        distance: '',
        elevationGain: '',
        avgHeartRate: '',
        maxHeartRate: '',
        avgPace: '',
        calories: '',
        notes: '',
      });
      onActivityAdded();
    } catch (error) {
      console.error('Error adding activity:', error);
      alert('Erreur lors de l\'ajout de l\'activité');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button className="btn-add-activity" onClick={() => setShowForm(true)}>
        ➕ Ajouter une activité manuellement
      </button>
    );
  }

  return (
    <div className="add-activity-form-container">
      <div className="form-header">
        <h3>➕ Ajouter une activité</h3>
        <button className="btn-close-form" onClick={() => setShowForm(false)}>
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="add-activity-form">
        <div className="form-row">
          <div className="form-group">
            <label>Athlète *</label>
            <select
              value={formData.athleteId}
              onChange={(e) => setFormData({ ...formData, athleteId: e.target.value })}
              required
            >
              <option value="">Sélectionner un athlète</option>
              {athletes.map((athlete) => {
                const name = athlete.first_name && athlete.last_name
                  ? `${athlete.first_name} ${athlete.last_name}`
                  : (athlete as any).user_name || athlete.name;
                return (
                  <option key={athlete.id} value={athlete.id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label>Type d'activité *</label>
            <select
              value={formData.activityType}
              onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
              required
            >
              <option value="running">🏃 Course à pied</option>
              <option value="cycling">🚴 Vélo</option>
              <option value="swimming">🏊 Natation</option>
              <option value="walking">🚶 Marche</option>
              <option value="hiking">🥾 Randonnée</option>
              <option value="gym">🏋️ Musculation</option>
              <option value="yoga">🧘 Yoga</option>
              <option value="other">💪 Autre</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Titre</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Nom de l'activité (optionnel)"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date et heure *</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Durée (minutes) *</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="60"
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Distance (km)</label>
            <input
              type="number"
              step="0.01"
              value={formData.distance}
              onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
              placeholder="10.5"
            />
          </div>

          <div className="form-group">
            <label>Dénivelé + (m)</label>
            <input
              type="number"
              step="0.1"
              value={formData.elevationGain}
              onChange={(e) => setFormData({ ...formData, elevationGain: e.target.value })}
              placeholder="150"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>FC moyenne (bpm)</label>
            <input
              type="number"
              value={formData.avgHeartRate}
              onChange={(e) => setFormData({ ...formData, avgHeartRate: e.target.value })}
              placeholder="145"
            />
          </div>

          <div className="form-group">
            <label>FC max (bpm)</label>
            <input
              type="number"
              value={formData.maxHeartRate}
              onChange={(e) => setFormData({ ...formData, maxHeartRate: e.target.value })}
              placeholder="175"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Allure moyenne (min/km)</label>
            <input
              type="text"
              value={formData.avgPace}
              onChange={(e) => setFormData({ ...formData, avgPace: e.target.value })}
              placeholder="5:30"
            />
          </div>

          <div className="form-group">
            <label>Calories</label>
            <input
              type="number"
              value={formData.calories}
              onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
              placeholder="500"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Commentaires sur l'activité..."
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
            Annuler
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '⏳ Ajout...' : '✅ Ajouter l\'activité'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddActivityForm;
