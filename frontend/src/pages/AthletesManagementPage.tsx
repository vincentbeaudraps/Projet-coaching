import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { athletesService } from '../services/api';
import { Athlete } from '../types/index';
import Header from '../components/Header';
import AthleteMetrics from '../components/AthleteMetrics';
import { useApi, useApiSubmit } from '../hooks/useApi';
import '../styles/AthletesManagement.css';

function AthletesManagementPage() {
  const { data: athletesData, loading, error: loadError, refetch } = useApi<Athlete[]>(
    () => athletesService.getAll(),
    []
  );
  
  const athletes = athletesData || [];

  const { submit: addAthlete, error: addError } = useApiSubmit(
    athletesService.createAthleteAccount
  );

  const { submit: deleteAthlete, error: deleteError } = useApiSubmit(
    athletesService.delete
  );

  const error = loadError || addError || deleteError;

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAthleteForMetrics, setSelectedAthleteForMetrics] = useState<Athlete | null>(null);
  const navigate = useNavigate();

  // Formulaire d'ajout
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    age: '',
    level: '',
    goals: ''
  });

  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await addAthlete({
      email: formData.email,
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : undefined,
      level: formData.level || undefined,
      goals: formData.goals || undefined,
    });

    if (success) {
      await refetch();
      setFormData({ email: '', name: '', age: '', level: '', goals: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteAthlete = async (athleteId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet athlète ? Cette action supprimera également toutes ses données (séances, performances, messages).')) {
      return;
    }
    
    const success = await deleteAthlete(athleteId);
    if (success) {
      await refetch();
      alert('Athlète supprimé avec succès');
    }
  };

  const handleMetricsUpdate = (_updatedAthlete: Athlete) => {
    refetch();
    setSelectedAthleteForMetrics(null);
  };

  if (loading) {
    return (
      <div className="athletes-wrapper">
        <Header />
        <div className="athletes-management-page">
          <div className="loading-container">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="athletes-wrapper">
      <Header />
      
      <div className="athletes-management-page">
        <div className="page-header">
          <h1 className="page-main-title">🏃 Mes Athlètes</h1>
          <p className="page-subtitle">Gérez vos athlètes et leurs métriques physiologiques</p>
        </div>

      <div className="page-content">
        <div className="page-header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Annuler' : '+ Ajouter un Athlète'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="add-athlete-form-card">
          <h2>Nouvel Athlète</h2>
          <form onSubmit={handleAddAthlete}>
            <div className="form-row">
              <div className="form-group">
                <label>Nom complet *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="ex: Jean Dupont"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="jean.dupont@example.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Âge</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="ex: 25"
                  min="10"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Niveau</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
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
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder="ex: Courir un marathon en moins de 4h"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                Ajouter l'Athlète
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des athlètes */}
      <div className="athletes-grid">
        {athletes.length === 0 ? (
          <div className="empty-state">
            <p>Aucun athlète pour le moment.</p>
            <p>Commencez par ajouter votre premier athlète !</p>
          </div>
        ) : (
          athletes.map((athlete) => (
            <div key={athlete.id} className="athlete-card">
              <div className="athlete-card-header">
                <div className="athlete-avatar">
                  {athlete.user_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="athlete-info">
                  <h3>{athlete.user_name || 'Sans nom'}</h3>
                  <p className="athlete-email">{athlete.user_email}</p>
                </div>
              </div>

              <div className="athlete-card-body">
                <div className="athlete-detail">
                  <span className="label">Âge:</span>
                  <span className="value">{athlete.age || 'Non renseigné'}</span>
                </div>
                <div className="athlete-detail">
                  <span className="label">Niveau:</span>
                  <span className="value">{athlete.level || 'Non renseigné'}</span>
                </div>
                {athlete.goals && (
                  <div className="athlete-detail">
                    <span className="label">Objectifs:</span>
                    <span className="value goals">{athlete.goals}</span>
                  </div>
                )}
                
                {/* Metrics Summary */}
                {(athlete.max_heart_rate || athlete.vma || athlete.weight) && (
                  <div className="athlete-metrics-summary">
                    {athlete.max_heart_rate && (
                      <span className="metric-badge">❤️ FC Max: {athlete.max_heart_rate} bpm</span>
                    )}
                    {athlete.vma && (
                      <span className="metric-badge">🏃 VMA: {athlete.vma} km/h</span>
                    )}
                    {athlete.weight && (
                      <span className="metric-badge">⚖️ {athlete.weight} kg</span>
                    )}
                  </div>
                )}
              </div>

              <div className="athlete-card-actions">
                <button
                  className="btn-view"
                  onClick={() => navigate(`/athletes/${athlete.id}`)}
                >
                  Voir le profil
                </button>
                <button
                  className="btn-metrics"
                  onClick={() => setSelectedAthleteForMetrics(athlete)}
                >
                  Gérer les métriques
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteAthlete(athlete.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
      
      {selectedAthleteForMetrics && (
        <AthleteMetrics
          athlete={selectedAthleteForMetrics}
          onClose={() => setSelectedAthleteForMetrics(null)}
          onUpdate={handleMetricsUpdate}
        />
      )}
      </div>
    </div>
  );
}

export default AthletesManagementPage;
