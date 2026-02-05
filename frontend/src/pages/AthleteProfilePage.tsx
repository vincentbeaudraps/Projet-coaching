import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { athletesService, sessionsService, performanceService } from '../services/api';
import Header from '../components/Header';
import '../styles/AthleteProfile.css';

interface Athlete {
  id: string;
  user_id: string;
  age: number | null;
  level: string | null;
  goals: string | null;
  user_name?: string;
  user_email?: string;
}

function AthleteProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [performances, setPerformances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    age: '',
    level: '',
    goals: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAthleteData();
  }, [id]);

  const loadAthleteData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [athleteRes, sessionsRes, performancesRes] = await Promise.all([
        athletesService.getById(id),
        sessionsService.getForAthlete(id),
        performanceService.getForAthlete(id)
      ]);
      
      setAthlete(athleteRes.data);
      setSessions(sessionsRes.data);
      setPerformances(performancesRes.data);
      
      setEditData({
        age: athleteRes.data.age?.toString() || '',
        level: athleteRes.data.level || '',
        goals: athleteRes.data.goals || ''
      });
    } catch (err: any) {
      setError('Erreur lors du chargement du profil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await athletesService.update(id, {
        age: editData.age ? parseInt(editData.age) : null,
        level: editData.level || null,
        goals: editData.goals || null
      });
      
      await loadAthleteData();
      setIsEditing(false);
      setError('');
    } catch (err: any) {
      setError('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleting(true);
    try {
      await athletesService.delete(id);
      navigate('/athletes');
    } catch (err: any) {
      setError('Erreur lors de la suppression');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Chargement...</div>;
  }

  if (!athlete) {
    return <div className="error-container">Athlète non trouvé</div>;
  }

  return (
    <div className="athlete-profile-container">
      <Header showBackButton backTo="/athletes" title={`Profil de ${athlete.user_name}`} />

      {error && <div className="error-message">{error}</div>}

      {/* En-tête du profil */}
      <div className="profile-header">
        <div className="profile-avatar-large">
          {athlete.user_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="profile-info">
          <h1>{athlete.user_name}</h1>
          <p className="profile-email">{athlete.user_email}</p>
        </div>
        <div className="profile-actions">
          <button 
            className="btn-edit"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '✕ Annuler' : '✏️ Modifier'}
          </button>
          <button 
            className="btn-delete"
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Confirmer la suppression</h2>
            <p>
              Êtes-vous sûr de vouloir supprimer <strong>{athlete.user_name}</strong> ?
            </p>
            <p className="warning-text">
              Cette action est <strong>irréversible</strong> et supprimera :
            </p>
            <ul className="warning-list">
              <li>Le compte utilisateur de l'athlète</li>
              <li>Toutes ses séances d'entraînement</li>
              <li>Toutes ses performances enregistrées</li>
              <li>Tous les messages échangés</li>
            </ul>
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button 
                className="btn-confirm-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '⏳ Suppression...' : '✓ Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'édition */}
      {isEditing && (
        <div className="edit-form-card">
          <h2>Modifier les informations</h2>
          <form onSubmit={handleUpdate}>
            <div className="form-row">
              <div className="form-group">
                <label>Âge</label>
                <input
                  type="number"
                  value={editData.age}
                  onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                  min="10"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Niveau</label>
                <select
                  value={editData.level}
                  onChange={(e) => setEditData({ ...editData, level: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Objectifs</label>
              <textarea
                value={editData.goals}
                onChange={(e) => setEditData({ ...editData, goals: e.target.value })}
                rows={4}
              />
            </div>
            <button type="submit" className="btn-primary">
              Enregistrer les modifications
            </button>
          </form>
        </div>
      )}

      {/* Informations actuelles */}
      <div className="profile-content">
        <div className="profile-section">
          <h2>📋 Informations</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Âge</span>
              <span className="info-value">{athlete.age || 'Non renseigné'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Niveau</span>
              <span className="info-value">{athlete.level || 'Non renseigné'}</span>
            </div>
            <div className="info-item full-width">
              <span className="info-label">Objectifs</span>
              <span className="info-value">{athlete.goals || 'Non renseignés'}</span>
            </div>
          </div>
        </div>

        {/* Séances */}
        <div className="profile-section">
          <h2>📅 Séances ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <p className="empty-message">Aucune séance assignée</p>
          ) : (
            <div className="sessions-list">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="session-item">
                  <div className="session-icon">🏃</div>
                  <div className="session-details">
                    <h4>{session.title}</h4>
                    <p>{session.type} • {session.duration} min</p>
                  </div>
                  <div className="session-date">
                    {new Date(session.start_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performances */}
        <div className="profile-section">
          <h2>📊 Dernières Performances ({performances.length})</h2>
          {performances.length === 0 ? (
            <p className="empty-message">Aucune performance enregistrée</p>
          ) : (
            <div className="performances-list">
              {performances.slice(0, 5).map((perf) => (
                <div key={perf.id} className="performance-item">
                  <div className="perf-date">
                    {new Date(perf.recorded_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="perf-details">
                    <span>{perf.actual_distance} km</span>
                    <span>{perf.actual_duration} min</span>
                    {perf.avg_heart_rate && <span>❤️ {perf.avg_heart_rate} bpm</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AthleteProfilePage;
