import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { sessionsService, performanceService, activitiesService, athletesService } from '../services/api';
import { TrainingSession, Performance, CompletedActivity } from '../types/index';
import Header from '../components/Header';
import Calendar from '../components/Calendar';
import CompletedActivitiesCalendar from '../components/CompletedActivitiesCalendar';
import '../styles/Dashboard.css';

function AthleteDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [completedActivities, setCompletedActivities] = useState<CompletedActivity[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [athleteId, setAthleteId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'performance' | 'messages'>('calendar');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAthleteData();
  }, []);

  const loadAthleteData = async () => {
    setLoading(true);
    try {
      // Récupérer le profil de l'athlète connecté via la route /me
      const athleteRes = await athletesService.getMe();
      const athlete = athleteRes.data;
      
      if (athlete) {
        setAthleteId(athlete.id);
        await loadData(athlete.id);
      }
    } catch (error) {
      console.error('Error loading athlete data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (athleteIdParam?: string) => {
    const targetAthleteId = athleteIdParam || athleteId;
    if (!targetAthleteId) return;

    try {
      const [sessionsRes, activitiesRes, performanceRes] = await Promise.all([
        sessionsService.getForAthlete(targetAthleteId),
        activitiesService.getForAthlete(targetAthleteId),
        performanceService.getForAthlete(targetAthleteId),
      ]);
      setSessions(sessionsRes.data);
      setCompletedActivities(activitiesRes.data);
      setPerformance(performanceRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !athleteId) return;

    try {
      await activitiesService.uploadGPX(file, athleteId);
      await loadData();
      alert('Fichier GPX importé avec succès !');
    } catch (error) {
      console.error('Error uploading GPX:', error);
      alert('Erreur lors de l\'import du fichier GPX');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <Header title="Dashboard Athlète" />
        <div className="dashboard-container">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Header title="Dashboard Athlète" />
      
      <div className="dashboard-container">
        <div className="dashboard-welcome">
          <h1>👋 Bienvenue, {user?.name}</h1>
          <p className="subtitle">Voici vos séances programmées et vos activités réalisées</p>
        </div>

        <nav className="dashboard-nav">
          <button
            className={activeTab === 'calendar' ? 'active' : ''}
            onClick={() => setActiveTab('calendar')}
          >
            📅 Mes Séances
          </button>
          <button
            className={activeTab === 'performance' ? 'active' : ''}
            onClick={() => setActiveTab('performance')}
          >
            📊 Performances
          </button>
          <button
            className={activeTab === 'messages' ? 'active' : ''}
            onClick={() => setActiveTab('messages')}
          >
            💬 Messages
          </button>
        </nav>

        <main className="dashboard-content">
          {activeTab === 'calendar' && (
            <div className="calendar-section">
              {/* Bouton pour importer GPX */}
              <div className="upload-section">
                <label htmlFor="gpx-upload" className="btn-upload">
                  📤 Importer une activité (GPX/FIT/TCX)
                </label>
                <input
                  id="gpx-upload"
                  type="file"
                  accept=".gpx,.fit,.tcx"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button 
                  className="btn-devices"
                  onClick={() => navigate('/devices')}
                >
                  🔗 Connecter mes appareils
                </button>
              </div>

              {/* Double Calendrier */}
              <div className="calendars-grid">
                {/* Calendrier des séances planifiées */}
                <div className="calendar-container">
                  <div className="calendar-header">
                    <h2>📋 Séances Programmées</h2>
                    <p className="calendar-subtitle">
                      {sessions.length} séance{sessions.length > 1 ? 's' : ''} planifiée{sessions.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Calendar
                    sessions={sessions}
                  />
                </div>

                {/* Calendrier des activités réalisées */}
                <div className="calendar-container">
                  <div className="calendar-header">
                    <h2>✅ Activités Réalisées</h2>
                    <p className="calendar-subtitle">
                      {completedActivities.length} activité{completedActivities.length > 1 ? 's' : ''} enregistrée{completedActivities.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <CompletedActivitiesCalendar
                    activities={completedActivities}
                    onActivityUpdated={() => loadData()}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="performance-view">
              <h2>📊 Historique des Performances</h2>
              {performance.length === 0 ? (
                <p>Aucune performance enregistrée pour le moment.</p>
              ) : (
                performance.map((record) => (
                  <div key={record.id} className="performance-card">
                    <p>Durée: {record.actual_duration} min</p>
                    {record.actual_distance && <p>Distance: {record.actual_distance} km</p>}
                    {record.avg_heart_rate && <p>FC moyenne: {record.avg_heart_rate} bpm</p>}
                    <p>Date: {new Date(record.recorded_at).toLocaleDateString('fr-FR')}</p>
                    {record.notes && <p>Notes: {record.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="messages-view">
              <h2>💬 Messages</h2>
              <p>Fonctionnalité de messagerie à venir...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AthleteDashboard;
