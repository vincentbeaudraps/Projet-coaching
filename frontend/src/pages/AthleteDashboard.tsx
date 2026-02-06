import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { sessionsService, activitiesService, athletesService } from '../services/api';
import { TrainingSession, CompletedActivity } from '../types/index';
import { showSuccess, showError } from '../utils/toast.tsx';
import Header from '../components/Header';
import Calendar from '../components/Calendar';
import CompletedActivitiesCalendar from '../components/CompletedActivitiesCalendar';
import '../styles/Dashboard.css';

function AthleteDashboard() {
  const user = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [completedActivities, setCompletedActivities] = useState<CompletedActivity[]>([]);
  const [athleteId, setAthleteId] = useState<string>('');
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
      const [sessionsRes, activitiesRes] = await Promise.all([
        sessionsService.getForAthlete(targetAthleteId),
        activitiesService.getForAthlete(targetAthleteId),
      ]);
      setSessions(sessionsRes.data);
      setCompletedActivities(activitiesRes.data);
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
      showSuccess('Fichier GPX importé avec succès');
    } catch (error) {
      console.error('Error uploading GPX:', error);
      showError('Erreur lors de l\'import', error as Error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <Header />
        <div className="dashboard-container">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Header />
      
      <div className="dashboard-container">
        <div className="dashboard-welcome">
          <h1>👋 Bienvenue, {user?.name}</h1>
          <p className="subtitle">Voici vos séances programmées et vos activités réalisées</p>
        </div>

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
            <Calendar sessions={sessions} />
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
    </div>
  );
}

export default AthleteDashboard;
