// filepath: frontend/src/pages/AthleteEnrichedDashboard.tsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { athletesService } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import { useApi, useApiSubmit } from '../hooks/useApi';
import Header from '../components/Header';
import '../styles/AthleteEnrichedDashboard.css';

interface AthleteProfile {
  id: string;
  user_id: string;
  age?: number;
  weight?: number;
  height?: number;
  vma?: number;
  max_heart_rate?: number;
  resting_heart_rate?: number;
  birth_date?: string;
  gender?: string;
  profile_photo_url?: string;
  city?: string;
  running_experience_years?: number;
  preferred_distances?: string;
  injury_history?: string;
  medical_notes?: string;
  total_distance_km?: number;
  total_time_hours?: number;
  total_sessions?: number;
}

interface PersonalRecord {
  id: string;
  distance_type: string;
  distance_km: number;
  time_seconds: number;
  pace: string;
  location?: string;
  race_name?: string;
  date_achieved: string;
}

interface UpcomingRace {
  id: string;
  name: string;
  location?: string;
  date: string;
  distance_km: number;
  distance_label?: string;
  elevation_gain?: number;
  target_time?: string;
  registration_status: string;
}

interface YearlyStats {
  year: number;
  total_km: number;
  total_hours: number;
  total_sessions: number;
}

interface AnnualVolume {
  id: string;
  athlete_id: string;
  year: number;
  volume_km: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function AthleteEnrichedDashboard() {
  const user = useAuthStore((state) => state.user);
  
  // Load all dashboard data using useApi
  const { data: dashboardDataWrapper, loading, refetch } = useApi(
    async () => {
      // Load athlete profile
      const profileRes = await athletesService.getMe();
      const profile = profileRes.data;

      // Load personal records (with silent error handling)
      let records: PersonalRecord[] = [];
      try {
        const recordsRes = await athletesService.getMyRecords();
        records = recordsRes.data || [];
      } catch (err) {
        console.warn('Records not available yet:', err);
      }

      // Load upcoming races (with silent error handling)
      let upcomingRaces: UpcomingRace[] = [];
      try {
        const racesRes = await athletesService.getMyRaces();
        upcomingRaces = racesRes.data || [];
      } catch (err) {
        console.warn('Races not available yet:', err);
      }

      // Load yearly stats (with silent error handling)
      let yearlyStats: YearlyStats[] = [];
      try {
        const statsRes = await athletesService.getYearlyStats();
        yearlyStats = statsRes.data || [];
      } catch (err) {
        console.warn('Stats not available yet:', err);
      }

      // Load annual volumes (with silent error handling)
      let annualVolumes: AnnualVolume[] = [];
      try {
        const volumesRes = await athletesService.getAnnualVolumes();
        annualVolumes = volumesRes.data || [];
      } catch (err) {
        console.warn('Annual volumes not available yet:', err);
      }

      return {
        data: {
          profile,
          records,
          upcomingRaces,
          yearlyStats,
          annualVolumes
        }
      };
    },
    []
  );

  const dashboardData = dashboardDataWrapper || {} as any;

  const profile = dashboardData?.profile || null;
  const records = dashboardData?.records || [];
  const upcomingRaces = dashboardData?.upcomingRaces || [];
  const yearlyStats = dashboardData?.yearlyStats || [];
  const annualVolumes = dashboardData?.annualVolumes || [];

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [addRecordMode, setAddRecordMode] = useState(false);
  const [addRaceMode, setAddRaceMode] = useState(false);
  const [addVolumeMode, setAddVolumeMode] = useState(false);
  const [recordForm, setRecordForm] = useState<any>({
    distance_type: '5km',
    distance_km: 5,
    time_seconds: '',
    time_display: '', // Format hh:mm:ss pour l'affichage
    pace: '',
    location: '',
    race_name: '',
    date_achieved: '',
    notes: ''
  });
  const [raceForm, setRaceForm] = useState<any>({
    name: '',
    location: '',
    date: '',
    distance_km: 21.1,
    distance_label: 'Semi-Marathon',
    elevation_gain: '',
    target_time: '',
    registration_status: 'planned',
    race_url: '',
    notes: ''
  });
  const [volumeForm, setVolumeForm] = useState({
    year: new Date().getFullYear(),
    volume_km: '',
    notes: ''
  });

  // Update profile using useApiSubmit
  const { submit: updateProfile } = useApiSubmit(async (data: any) => {
    const res = await athletesService.updateMe(data);
    setEditMode(false);
    showSuccess('Profil mis à jour avec succès');
    await refetch();
    return res;
  });

  // Add record using useApiSubmit
  const { submit: addRecord } = useApiSubmit(async (data: any) => {
    if (!data.distance_km || !data.time_seconds || !data.date_achieved) {
      throw new Error('Veuillez remplir tous les champs obligatoires');
    }
    const res = await athletesService.addRecord(data);
    setAddRecordMode(false);
    setRecordForm({
      distance_type: '5km',
      distance_km: 5,
      time_seconds: '',
      time_display: '',
      pace: '',
      location: '',
      race_name: '',
      date_achieved: '',
      notes: ''
    });
    showSuccess('Record personnel ajouté avec succès');
    await refetch();
    return res;
  });

  // Add race using useApiSubmit
  const { submit: addRace } = useApiSubmit(async (data: any) => {
    if (!data.name || !data.date || !data.distance_km) {
      throw new Error('Veuillez remplir tous les champs obligatoires');
    }
    const res = await athletesService.addRace(data);
    setAddRaceMode(false);
    setRaceForm({
      name: '',
      location: '',
      date: '',
      distance_km: 21.1,
      distance_label: 'Semi-Marathon',
      elevation_gain: '',
      target_time: '',
      registration_status: 'planned',
      race_url: '',
      notes: ''
    });
    showSuccess('Course ajoutée avec succès');
    await refetch();
    return res;
  });

  // Add/update volume using useApiSubmit
  const { submit: saveVolume } = useApiSubmit(async (data: any) => {
    if (!data.year || !data.volume_km) {
      throw new Error('Veuillez remplir l\'année et le volume');
    }
    const res = await athletesService.saveAnnualVolume({
      year: parseInt(data.year.toString()),
      volume_km: parseFloat(data.volume_km),
      notes: data.notes
    });
    setAddVolumeMode(false);
    setVolumeForm({
      year: new Date().getFullYear(),
      volume_km: '',
      notes: ''
    });
    showSuccess('Volume annuel enregistré avec succès');
    await refetch();
    return res;
  });

  // Delete volume using useApiSubmit
  const { submit: deleteVolume } = useApiSubmit(async (year: number) => {
    const res = await athletesService.deleteAnnualVolume(year);
    showSuccess('Volume supprimé avec succès');
    await refetch();
    return res;
  });

  // Initialize form when profile is loaded
  useEffect(() => {
    if (profile) {
      setEditForm({
        weight: profile.weight || '',
        height: profile.height || '',
        vma: profile.vma || '',
        max_heart_rate: profile.max_heart_rate || '',
        resting_heart_rate: profile.resting_heart_rate || '',
        birth_date: profile.birth_date || '',
        gender: profile.gender || '',
        city: profile.city || '',
        running_experience_years: profile.running_experience_years || '',
        preferred_distances: profile.preferred_distances || '',
        injury_history: profile.injury_history || '',
        medical_notes: profile.medical_notes || '',
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    await updateProfile(editForm);
  };

  const handleFormChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleRecordFormChange = (field: string, value: any) => {
    setRecordForm((prev: any) => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate distance_km based on distance_type
      if (field === 'distance_type') {
        const distanceMap: any = {
          '5km': 5,
          '10km': 10,
          'half_marathon': 21.0975,
          'marathon': 42.195,
          'custom': updated.distance_km
        };
        updated.distance_km = distanceMap[value] || updated.distance_km;
      }
      
      // Auto-calculate pace if time and distance are set
      if ((field === 'time_seconds' || field === 'distance_km') && updated.time_seconds && updated.distance_km) {
        const paceSeconds = updated.time_seconds / updated.distance_km;
        const paceMin = Math.floor(paceSeconds / 60);
        const paceSec = Math.floor(paceSeconds % 60);
        updated.pace = `${paceMin}:${paceSec.toString().padStart(2, '0')}`;
      }
      
      return updated;
    });
  };

  const handleRaceFormChange = (field: string, value: any) => {
    setRaceForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleAddRecord = async () => {
    await addRecord(recordForm);
  };

  const handleAddRace = async () => {
    await addRace(raceForm);
  };

  const handleAddVolume = async () => {
    await saveVolume(volumeForm);
  };

  const handleDeleteVolume = async (year: number) => {
    if (!confirm(`Supprimer le volume pour l'année ${year} ?`)) return;
    await deleteVolume(year);
  };

  const calculateVDOT = (timeSeconds: number, distanceKm: number): number => {
    // Formule VDOT de Jack Daniels (basée sur VO2max)
    const distanceMeters = distanceKm * 1000;
    const velocityMetersPerMin = distanceMeters / (timeSeconds / 60);
    
    // Calcul du pourcentage de VO2max utilisé
    const percentVO2max = 0.8 + 0.1894393 * Math.exp(-0.012778 * (timeSeconds / 60)) + 0.2989558 * Math.exp(-0.1932605 * (timeSeconds / 60));
    
    // Calcul du VO2 (ml/kg/min)
    const vo2 = -4.60 + 0.182258 * velocityMetersPerMin + 0.000104 * Math.pow(velocityMetersPerMin, 2);
    
    // Calcul du VDOT (VO2max estimé)
    const vdot = vo2 / percentVO2max;
    
    return Math.round(vdot * 10) / 10;
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const daysUntilRace = (raceDate: string): number => {
    const today = new Date();
    const race = new Date(raceDate);
    const diffTime = race.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <Header />
        <div className="enriched-dashboard-container">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Header />
      
      <div className="enriched-dashboard-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-photo-section">
            <div className="profile-photo">
              {profile?.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt={user?.name} />
              ) : (
                <div className="profile-photo-placeholder">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button className="edit-photo-btn">📷</button>
          </div>

          <div className="profile-info">
            <h1>{user?.name}</h1>
            <div className="profile-badges">
              <span className="badge-active">Actif</span>
              <span className="badge-subscription">109 € / mois</span>
              {profile?.city && <span className="badge-location">📍 {profile.city}</span>}
            </div>
            
            <div className="profile-stats-row">
              {profile?.age && (
                <div className="stat-item">
                  <span className="stat-icon">🎂</span>
                  <span className="stat-value">{profile.age} ans</span>
                </div>
              )}
              {profile?.weight && (
                <div className="stat-item">
                  <span className="stat-icon">⚖️</span>
                  <span className="stat-value">{profile.weight} kg</span>
                </div>
              )}
              {profile?.vma && (
                <div className="stat-item">
                  <span className="stat-icon">⚡</span>
                  <span className="stat-value">VMA: {profile.vma} km/h</span>
                </div>
              )}
              {profile?.max_heart_rate && (
                <div className="stat-item">
                  <span className="stat-icon">❤️</span>
                  <span className="stat-value">FC max: {profile.max_heart_rate} bpm</span>
                </div>
              )}
            </div>

            <button className="btn-edit-profile" onClick={() => setEditMode(true)}>
              ✏️ Modifier mon profil
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Records Personnels */}
          <div className="dashboard-card records-card">
            <h2>🏆 Records personnels</h2>
            <div className="records-grid">
              {records.map((record: PersonalRecord) => {
                const vdot = calculateVDOT(record.time_seconds, record.distance_km);
                return (
                  <div key={record.id} className="record-item">
                    <div className="record-distance">{record.distance_type}</div>
                    <div className="record-time">{formatTime(record.time_seconds)}</div>
                    <div className="record-pace">Allure: {record.pace} /km</div>
                    <div className="record-vdot">VDOT: {vdot}</div>
                    <div className="record-date">{formatDate(record.date_achieved)}</div>
                    {record.race_name && (
                      <div className="record-location">{record.race_name}</div>
                    )}
                  </div>
                );
              })}
              
              <button className="btn-add-record" onClick={() => setAddRecordMode(true)}>+ Ajouter un record</button>
            </div>
          </div>

          {/* VDOT Calculé */}
          <div className="dashboard-card vdot-card">
            <h2>📊 VDOT</h2>
            <div className="vdot-display">
              {records.length > 0 && (
                <>
                  <div className="vdot-value">
                    {calculateVDOT(records[0].time_seconds, records[0].distance_km)}
                  </div>
                  <div className="vdot-subtitle">Basé sur {records[0].distance_type}</div>
                  <div className="vdot-chart">
                    {/* Graphique VDOT simplifié */}
                    <div className="vdot-bar" style={{ width: '75%' }}></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Courses à Venir */}
          <div className="dashboard-card races-card">
            <h2>🏁 Courses à venir</h2>
            <div className="races-list">
              {upcomingRaces.map((race: UpcomingRace) => {
                const days = daysUntilRace(race.date);
                return (
                  <div key={race.id} className="race-item">
                    <div className="race-header">
                      <span className="race-distance-badge">
                        {race.distance_label || `${race.distance_km} km`}
                      </span>
                      <span className="race-countdown">J-{days}</span>
                    </div>
                    <div className="race-name">{race.name}</div>
                    <div className="race-date">{formatDate(race.date)}</div>
                    {race.location && (
                      <div className="race-location">📍 {race.location}</div>
                    )}
                    {race.elevation_gain && (
                      <div className="race-elevation">⛰️ D+: {race.elevation_gain}m</div>
                    )}
                    {race.target_time && (
                      <div className="race-target">🎯 Objectif: {race.target_time}</div>
                    )}
                  </div>
                );
              })}
              
              <button className="btn-add-race" onClick={() => setAddRaceMode(true)}>+ Ajouter une course</button>
            </div>
          </div>

          {/* Volume Annuel */}
          <div className="dashboard-card volume-card">
            <h2>📈 Volume annuel</h2>
            <div className="volume-stats">
              <div className="current-year-stat">
                {annualVolumes.find((v: AnnualVolume) => v.year === new Date().getFullYear()) ? (
                  <>
                    <div className="stat-value-large">
                      {annualVolumes.find((v: AnnualVolume) => v.year === new Date().getFullYear())?.volume_km || 0} km
                    </div>
                    <div className="stat-label">Cette année (manuel)</div>
                  </>
                ) : (
                  <>
                    <div className="stat-value-large">{yearlyStats[yearlyStats.length - 1]?.total_km || 0} km</div>
                    <div className="stat-label">Cette année (auto)</div>
                  </>
                )}
              </div>
            </div>
            
            <div className="volume-list">
              {annualVolumes.sort((a: AnnualVolume, b: AnnualVolume) => b.year - a.year).slice(0, 5).map((volume: AnnualVolume) => (
                <div key={volume.year} className="volume-item">
                  <div className="volume-year-label">{volume.year}</div>
                  <div className="volume-km-value">{volume.volume_km} km</div>
                  <button 
                    className="btn-delete-small" 
                    onClick={() => handleDeleteVolume(volume.year)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            
            <button className="btn-add-race" onClick={() => setAddVolumeMode(true)}>
              + Ajouter un volume annuel
            </button>
          </div>

          {/* Statistiques d'Entraînement */}
          <div className="dashboard-card training-stats-card">
            <h2>💪 Statistiques d'entraînement</h2>
            <div className="training-stats-grid">
              <div className="training-stat">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">{profile?.total_sessions || 0}</div>
                  <div className="stat-label">Séances total</div>
                </div>
              </div>
              
              <div className="training-stat">
                <div className="stat-icon">🏃</div>
                <div className="stat-content">
                  <div className="stat-value">{profile?.total_distance_km || 0} km</div>
                  <div className="stat-label">Distance totale</div>
                </div>
              </div>
              
              <div className="training-stat">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <div className="stat-value">{profile?.total_time_hours || 0}h</div>
                  <div className="stat-label">Temps total</div>
                </div>
              </div>
              
              {profile?.running_experience_years && (
                <div className="training-stat">
                  <div className="stat-icon">🎖️</div>
                  <div className="stat-content">
                    <div className="stat-value">{profile.running_experience_years} ans</div>
                    <div className="stat-label">Expérience</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Physique */}
          <div className="dashboard-card physique-card">
            <h2>🏋️ Physique</h2>
            <div className="physique-stats">
              {profile?.weight && profile?.height && (
                <>
                  <div className="physique-stat">
                    <span className="physique-label">Poids</span>
                    <span className="physique-value">{profile.weight} kg</span>
                  </div>
                  <div className="physique-stat">
                    <span className="physique-label">Taille</span>
                    <span className="physique-value">{profile.height} cm</span>
                  </div>
                  <div className="physique-stat">
                    <span className="physique-label">IMC</span>
                    <span className="physique-value">
                      {(profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)}
                    </span>
                  </div>
                </>
              )}
              {profile?.vma && (
                <div className="physique-stat">
                  <span className="physique-label">VMA</span>
                  <span className="physique-value">{profile.vma} km/h</span>
                </div>
              )}
              {profile?.max_heart_rate && (
                <div className="physique-stat">
                  <span className="physique-label">FC max</span>
                  <span className="physique-value">{profile.max_heart_rate} bpm</span>
                </div>
              )}
              {profile?.resting_heart_rate && (
                <div className="physique-stat">
                  <span className="physique-label">FC repos</span>
                  <span className="physique-value">{profile.resting_heart_rate} bpm</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Édition Profil */}
        {editMode && (
          <div className="modal-overlay" onClick={() => setEditMode(false)}>
            <div className="modal-content profile-edit-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✏️ Modifier mon profil</h2>
                <button className="modal-close" onClick={() => setEditMode(false)}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Poids (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      value={editForm.weight}
                      onChange={(e) => handleFormChange('weight', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Taille (cm)</label>
                    <input
                      type="number"
                      placeholder="175"
                      value={editForm.height}
                      onChange={(e) => handleFormChange('height', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>VMA (km/h)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="15.5"
                      value={editForm.vma}
                      onChange={(e) => handleFormChange('vma', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>FC max (bpm)</label>
                    <input
                      type="number"
                      placeholder="190"
                      value={editForm.max_heart_rate}
                      onChange={(e) => handleFormChange('max_heart_rate', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>FC repos (bpm)</label>
                    <input
                      type="number"
                      placeholder="50"
                      value={editForm.resting_heart_rate}
                      onChange={(e) => handleFormChange('resting_heart_rate', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Date de naissance</label>
                    <input
                      type="date"
                      value={editForm.birth_date}
                      onChange={(e) => handleFormChange('birth_date', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Genre</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => handleFormChange('gender', e.target.value)}
                    >
                      <option value="">Sélectionner</option>
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Ville</label>
                    <input
                      type="text"
                      placeholder="Lyon"
                      value={editForm.city}
                      onChange={(e) => handleFormChange('city', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Années d'expérience en course</label>
                    <input
                      type="number"
                      placeholder="5"
                      value={editForm.running_experience_years}
                      onChange={(e) => handleFormChange('running_experience_years', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Distances préférées</label>
                    <input
                      type="text"
                      placeholder="10km, Semi-Marathon"
                      value={editForm.preferred_distances}
                      onChange={(e) => handleFormChange('preferred_distances', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Historique de blessures</label>
                    <textarea
                      rows={3}
                      placeholder="Tendinite achilléenne en 2023..."
                      value={editForm.injury_history}
                      onChange={(e) => handleFormChange('injury_history', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Notes médicales</label>
                    <textarea
                      rows={3}
                      placeholder="Allergies, traitements en cours..."
                      value={editForm.medical_notes}
                      onChange={(e) => handleFormChange('medical_notes', e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setEditMode(false)}>Annuler</button>
                <button className="btn-save" onClick={handleSaveProfile}>💾 Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ajout Record */}
        {addRecordMode && (
          <div className="modal-overlay" onClick={() => setAddRecordMode(false)}>
            <div className="modal-content record-add-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🏆 Ajouter un record personnel</h2>
                <button className="modal-close" onClick={() => setAddRecordMode(false)}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Type de distance *</label>
                    <select
                      value={recordForm.distance_type}
                      onChange={(e) => handleRecordFormChange('distance_type', e.target.value)}
                    >
                      <option value="5km">5 km</option>
                      <option value="10km">10 km</option>
                      <option value="half_marathon">Semi-Marathon (21.1 km)</option>
                      <option value="marathon">Marathon (42.2 km)</option>
                      <option value="custom">Distance personnalisée</option>
                    </select>
                  </div>

                  {recordForm.distance_type === 'custom' && (
                    <div className="form-group">
                      <label>Distance (km) *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="15.5"
                        value={recordForm.distance_km}
                        onChange={(e) => handleRecordFormChange('distance_km', e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>Temps (hh:mm:ss) *</label>
                    <input
                      type="text"
                      placeholder="00:40:00"
                      value={recordForm.time_display}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permettre uniquement les chiffres et les :
                        if (/^[\d:]*$/.test(value)) {
                          handleRecordFormChange('time_display', value);
                          // Convertir en secondes
                          const parts = value.split(':');
                          let seconds = 0;
                          if (parts.length === 3) {
                            seconds = (parseInt(parts[0]) || 0) * 3600 + (parseInt(parts[1]) || 0) * 60 + (parseInt(parts[2]) || 0);
                          } else if (parts.length === 2) {
                            seconds = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
                          }
                          handleRecordFormChange('time_seconds', seconds);
                        }
                      }}
                    />
                    <small>Ex: 40 min = 00:40:00</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Allure (min/km)</label>
                    <input
                      type="text"
                      placeholder="4:00"
                      value={recordForm.pace}
                      readOnly
                      disabled
                    />
                    <small>Calculée automatiquement</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={recordForm.date_achieved}
                      onChange={(e) => handleRecordFormChange('date_achieved', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Nom de la course</label>
                    <input
                      type="text"
                      placeholder="Run in Lyon"
                      value={recordForm.race_name}
                      onChange={(e) => handleRecordFormChange('race_name', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Lieu</label>
                    <input
                      type="text"
                      placeholder="Parc de la Tête d'Or, Lyon"
                      value={recordForm.location}
                      onChange={(e) => handleRecordFormChange('location', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Conditions, ressenti, objectifs..."
                      value={recordForm.notes}
                      onChange={(e) => handleRecordFormChange('notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setAddRecordMode(false)}>Annuler</button>
                <button className="btn-save" onClick={handleAddRecord}>🏆 Ajouter le record</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ajout Course */}
        {addRaceMode && (
          <div className="modal-overlay" onClick={() => setAddRaceMode(false)}>
            <div className="modal-content race-add-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🏁 Ajouter une course à venir</h2>
                <button className="modal-close" onClick={() => setAddRaceMode(false)}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Nom de la course *</label>
                    <input
                      type="text"
                      placeholder="Semi-Marathon de Lyon"
                      value={raceForm.name}
                      onChange={(e) => handleRaceFormChange('name', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={raceForm.date}
                      onChange={(e) => handleRaceFormChange('date', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Lieu</label>
                    <input
                      type="text"
                      placeholder="Lyon, France"
                      value={raceForm.location}
                      onChange={(e) => handleRaceFormChange('location', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Distance (km) *</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="21.1"
                      value={raceForm.distance_km}
                      onChange={(e) => handleRaceFormChange('distance_km', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Label distance</label>
                    <select
                      value={raceForm.distance_label}
                      onChange={(e) => handleRaceFormChange('distance_label', e.target.value)}
                    >
                      <option value="5km">5 km</option>
                      <option value="10km">10 km</option>
                      <option value="Semi-Marathon">Semi-Marathon</option>
                      <option value="Marathon">Marathon</option>
                      <option value="Trail">Trail</option>
                      <option value="Ultra">Ultra</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Dénivelé (m)</label>
                    <input
                      type="number"
                      placeholder="150"
                      value={raceForm.elevation_gain}
                      onChange={(e) => handleRaceFormChange('elevation_gain', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Temps objectif</label>
                    <input
                      type="text"
                      placeholder="1:30:00"
                      value={raceForm.target_time}
                      onChange={(e) => handleRaceFormChange('target_time', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Statut inscription</label>
                    <select
                      value={raceForm.registration_status}
                      onChange={(e) => handleRaceFormChange('registration_status', e.target.value)}
                    >
                      <option value="planned">Prévu</option>
                      <option value="confirmed">Inscrit</option>
                      <option value="pending">En attente</option>
                      <option value="completed">Terminé</option>
                    </select>
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Lien inscription</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={raceForm.race_url}
                      onChange={(e) => handleRaceFormChange('race_url', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Objectifs, préparation..."
                      value={raceForm.notes}
                      onChange={(e) => handleRaceFormChange('notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setAddRaceMode(false)}>Annuler</button>
                <button className="btn-save" onClick={handleAddRace}>🏁 Ajouter la course</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Annual Volume */}
        {addVolumeMode && (
          <div className="modal-overlay" onClick={() => setAddVolumeMode(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📈 Ajouter un volume annuel</h2>
                <button className="btn-close" onClick={() => setAddVolumeMode(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Année *</label>
                    <input
                      type="number"
                      min="2000"
                      max="2099"
                      placeholder="2026"
                      value={volumeForm.year}
                      onChange={(e) => setVolumeForm({ ...volumeForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Volume (km) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="2500"
                      value={volumeForm.volume_km}
                      onChange={(e) => setVolumeForm({ ...volumeForm, volume_km: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Commentaires, objectifs..."
                      value={volumeForm.notes}
                      onChange={(e) => setVolumeForm({ ...volumeForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setAddVolumeMode(false)}>Annuler</button>
                <button className="btn-save" onClick={handleAddVolume}>💾 Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
