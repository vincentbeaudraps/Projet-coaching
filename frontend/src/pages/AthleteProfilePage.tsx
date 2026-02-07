import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { athletesService, sessionsService, performanceService } from '../services/api';
import { useApi, useApiSubmit } from '../hooks/useApi';
import { Athlete } from '../types/index';
import Header from '../components/Header';
import AthleteMetrics from '../components/AthleteMetrics';
import TrainingZones from '../components/TrainingZones';
import '../styles/AthleteProfile.css';

function AthleteProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    age: '',
    level: '',
    goals: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'zones' | 'sessions'>('overview');

  // Pour les athlètes qui consultent leur propre profil
  const isOwnProfile = !id || (user?.role === 'athlete');

  // Load athlete data
  const { data: athleteDataWrapper, loading, error: loadError, refetch } = useApi(
    async () => {
      let athleteData;
      
      // Si pas d'ID ou utilisateur athlète, charger son propre profil
      if (isOwnProfile) {
        const athleteRes = await athletesService.getMe();
        athleteData = athleteRes.data;
      } else {
        const athleteRes = await athletesService.getById(id!);
        athleteData = athleteRes.data;
      }

      // Charger les séances et performances
      const [sessionsRes, performancesRes] = await Promise.all([
        sessionsService.getForAthlete(athleteData.id),
        performanceService.getForAthlete(athleteData.id)
      ]);
      
      return {
        data: {
          athlete: athleteData,
          sessions: sessionsRes.data,
          performances: performancesRes.data
        }
      };
    },
    [id, isOwnProfile]
  );

  const athleteData = athleteDataWrapper || {} as any;
  const athlete = athleteData.athlete || null;
  const sessions = athleteData.sessions || [];
  const performances = athleteData.performances || [];
  const error = loadError || '';

  // Update athlete using useApiSubmit
  const { submit: updateAthlete } = useApiSubmit(async (data: any) => {
    if (!athlete?.id) throw new Error('No athlete ID');
    const res = await athletesService.update(athlete.id, {
      age: data.age ? parseInt(data.age) : null,
      level: data.level || null,
      goals: data.goals || null
    });
    setIsEditing(false);
    await refetch();
    return res;
  });

  // Delete athlete using useApiSubmit
  const { submit: deleteAthlete, loading: deleting } = useApiSubmit(async (_?: void) => {
    if (!athlete?.id) throw new Error('No athlete ID');
    const res = await athletesService.delete(athlete.id);
    navigate('/athletes');
    return res;
  });

  // Initialize edit form when athlete data loads
  useEffect(() => {
    if (athlete) {
      setEditData({
        age: athlete.age?.toString() || '',
        level: athlete.level || '',
        goals: athlete.goals || ''
      });
    }
  }, [athlete]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAthlete(editData);
  };

  const handleDelete = async () => {
    await deleteAthlete();
  };

  const handleMetricsUpdate = () => {
    refetch(); // Recharger les données après mise à jour des métriques
    setShowMetricsModal(false);
  };

  const formatPace = (pace?: string) => {
    return pace || 'Non renseigné';
  };

  if (loading) {
    return (
      <div className="athlete-profile-wrapper">
        <Header />
        <div className="athlete-profile-page">
          <div className="loading-content">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="athlete-profile-wrapper">
        <Header />
        <div className="athlete-profile-page">
          <div className="error-content">Athlète non trouvé</div>
        </div>
      </div>
    );
  }

  return (
    <div className="athlete-profile-wrapper">
      <Header />
      
      <div className="athlete-profile-page">
        <div className="page-header">
          <h1 className="page-main-title">
            {isOwnProfile ? '👤 Mon Profil' : `👤 Profil de ${athlete.user_name || athlete.name}`}
          </h1>
          <p className="page-subtitle">
            {isOwnProfile ? 'Consultez et gérez vos informations personnelles' : 'Informations et métriques de l\'athlète'}
          </p>
        </div>

      {error && <div className="error-message">{error}</div>}

      {/* En-tête du profil */}
      <div className="profile-header">
        <div className="profile-avatar-large">
          {(athlete.user_name || athlete.name)?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="profile-info">
          <h1>{athlete.user_name || athlete.name}</h1>
          <p className="profile-email">{athlete.user_email || athlete.email}</p>
        </div>
        <div className="profile-actions">
          <button 
            className="btn-metrics"
            onClick={() => setShowMetricsModal(true)}
            title="Gérer les métriques physiologiques"
          >
            Métriques
          </button>
          {user?.role === 'coach' && (
            <>
              <button 
                className="btn-edit"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Annuler' : 'Modifier'}
              </button>
              <button 
                className="btn-delete"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de métriques */}
      {showMetricsModal && athlete && (
        <div className="modal-overlay" onClick={() => setShowMetricsModal(false)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <AthleteMetrics
              athlete={athlete}
              onClose={() => setShowMetricsModal(false)}
              onUpdate={handleMetricsUpdate}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmer la suppression</h2>
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
                {deleting ? 'Suppression...' : 'Confirmer la suppression'}
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
        {/* Onglets */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button 
            className={`tab-btn ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => setActiveTab('zones')}
          >
            Zones d'entraînement
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Séances & Performances
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'overview' && (
          <>
        {/* Métriques Physiologiques */}
        <div className="profile-section">
          <h2>Métriques Physiologiques</h2>
          {athlete.max_heart_rate || athlete.vma || athlete.vo2max ? (
            <div className="metrics-grid">
              {athlete.max_heart_rate && (
                <div className="metric-card">
                  <div className="metric-details">
                    <span className="metric-label">FC Max</span>
                    <span className="metric-value">{athlete.max_heart_rate} bpm</span>
                  </div>
                </div>
              )}
              {athlete.resting_heart_rate && (
                <div className="metric-card">
                  <div className="metric-details">
                    <span className="metric-label">FC Repos</span>
                    <span className="metric-value">{athlete.resting_heart_rate} bpm</span>
                  </div>
                </div>
              )}
              {athlete.vma && (
                <div className="metric-card">
                  <div className="metric-details">
                    <span className="metric-label">VMA</span>
                    <span className="metric-value">{athlete.vma} km/h</span>
                  </div>
                </div>
              )}
              {athlete.vo2max && (
                <div className="metric-card">
                  <div className="metric-details">
                    <span className="metric-label">VO2 Max</span>
                    <span className="metric-value">{athlete.vo2max} ml/kg/min</span>
                  </div>
                </div>
              )}
              {athlete.weight && (
                <div className="metric-card">
                  <div className="metric-details">
                    <span className="metric-label">Poids</span>
                    <span className="metric-value">{athlete.weight} kg</span>
                  </div>
                </div>
              )}
              {athlete.lactate_threshold_pace && (
                <div className="metric-card">
                  <div className="metric-details">
                    <span className="metric-label">Seuil Lactique</span>
                    <span className="metric-value">{formatPace(athlete.lactate_threshold_pace)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-metrics">
              <p>Aucune métrique renseignée</p>
              <button 
                className="btn-add-metrics"
                onClick={() => setShowMetricsModal(true)}
              >
                Ajouter des métriques
              </button>
            </div>
          )}
          {athlete.metrics_updated_at && (
            <p className="metrics-update-date">
              Dernière mise à jour : {new Date(athlete.metrics_updated_at).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          )}
        </div>

        <div className="profile-section">
          <h2>Informations</h2>
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
          <h2>Séances ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <p className="empty-message">Aucune séance assignée</p>
          ) : (
            <div className="sessions-list">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="session-item">
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
          <h2>Dernières Performances ({performances.length})</h2>
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
                    {perf.avg_heart_rate && <span>FC: {perf.avg_heart_rate} bpm</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}

        {/* Onglet Zones d'entraînement */}
        {activeTab === 'zones' && (
          <div className="profile-section">
            <TrainingZones
              fcMax={athlete.max_heart_rate || undefined}
              fcRepos={athlete.resting_heart_rate || undefined}
              vma={athlete.vma || undefined}
            />
          </div>
        )}

        {/* Onglet Séances & Performances */}
        {activeTab === 'sessions' && (
          <>
            {/* Séances */}
            <div className="profile-section">
              <h2>Séances ({sessions.length})</h2>
              {sessions.length === 0 ? (
                <p className="empty-message">Aucune séance assignée</p>
              ) : (
                <div className="sessions-list">
                  {sessions.map((session) => (
                    <div key={session.id} className="session-item">
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
              <h2>Performances ({performances.length})</h2>
              {performances.length === 0 ? (
                <p className="empty-message">Aucune performance enregistrée</p>
              ) : (
                <div className="performances-list">
                  {performances.map((perf) => (
                    <div key={perf.id} className="performance-item">
                      <div className="perf-date">
                        {new Date(perf.recorded_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="perf-details">
                        <span>{perf.actual_distance} km</span>
                        <span>{perf.actual_duration} min</span>
                        {perf.avg_heart_rate && <span>FC: {perf.avg_heart_rate} bpm</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}

export default AthleteProfilePage;
