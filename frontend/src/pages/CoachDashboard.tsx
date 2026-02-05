import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsService, athletesService, activitiesService } from '../services/api';
import { TrainingSession, Athlete, CompletedActivity } from '../types/index';
import Header from '../components/Header';
import Calendar from '../components/Calendar';
import CompletedActivitiesCalendar from '../components/CompletedActivitiesCalendar';
import AddActivityForm from '../components/AddActivityForm';
import SessionForm from '../components/SessionForm';
import AthleteList from '../components/AthleteList';
import Dashboard from '../components/Dashboard';
import '../styles/Dashboard.css';

function CoachDashboard() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [activities, setActivities] = useState<CompletedActivity[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'athletes' | 'sessions'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [uploadingGPX, setUploadingGPX] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [athletesRes, sessionsRes, activitiesRes] = await Promise.all([
        athletesService.getAll(),
        sessionsService.getAll(),
        activitiesService.getAllForCoach(),
      ]);
      setAthletes(athletesRes.data);
      setSessions(sessionsRes.data);
      setActivities(activitiesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionCreated = async (sessionData: any) => {
    try {
      await sessionsService.create(sessionData);
      await loadData();
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAthleteId) {
      alert('Veuillez sélectionner un athlète et un fichier GPX');
      return;
    }

    setUploadingGPX(true);
    try {
      await activitiesService.uploadGPX(file, selectedAthleteId);
      await loadData();
      alert('Activité importée avec succès !');
    } catch (error) {
      console.error('Error uploading GPX:', error);
      alert('Erreur lors de l\'import du fichier GPX');
    } finally {
      setUploadingGPX(false);
      event.target.value = '';
    }
  };

  // Filtrer les séances selon l'athlète sélectionné
  const filteredSessions = selectedAthleteId
    ? sessions.filter((session) => session.athlete_id === selectedAthleteId)
    : sessions;

  const filteredActivities = selectedAthleteId
    ? activities.filter((activity) => activity.athlete_id === selectedAthleteId)
    : activities;

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);

  if (loading) {
    return <div className="dashboard-container">Chargement...</div>;
  }

  return (
    <div className="dashboard-container">
      <Header title="Tableau de Bord Coach" />

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Vue d'ensemble
        </button>
        <button
          className={activeTab === 'calendar' ? 'active' : ''}
          onClick={() => setActiveTab('calendar')}
        >
          📅 Calendrier
        </button>
        <button
          onClick={() => navigate('/athletes')}
        >
          🏃 Mes Athlètes
        </button>
        <button
          onClick={() => navigate('/invitations')}
        >
          📨 Codes d'Invitation
        </button>
        <button
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          🎯 Séances
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'dashboard' && <Dashboard athletes={athletes} sessions={sessions} />}
        
        {activeTab === 'calendar' && (
          <div className="calendar-container">
            <div className="athlete-selector">
              <label htmlFor="athlete-select">Sélectionner un athlète :</label>
              <select
                id="athlete-select"
                value={selectedAthleteId || ''}
                onChange={(e) => setSelectedAthleteId(e.target.value || null)}
                className="athlete-select-dropdown"
              >
                <option value="">Tous les athlètes</option>
                {athletes.map((athlete) => {
                  const athleteName = athlete.first_name && athlete.last_name
                    ? `${athlete.first_name} ${athlete.last_name}`
                    : (athlete as any).user_name || athlete.name || 'Athlète';
                  return (
                    <option key={athlete.id} value={athlete.id}>
                      {athleteName}
                    </option>
                  );
                })}
              </select>
              {selectedAthlete && (
                <div className="selected-athlete-info">
                  <span className="athlete-badge">
                    🏃 {selectedAthlete.first_name && selectedAthlete.last_name
                      ? `${selectedAthlete.first_name} ${selectedAthlete.last_name}`
                      : (selectedAthlete as any).user_name || selectedAthlete.name || 'Athlète'}
                  </span>
                  <span className="sessions-count">
                    {filteredSessions.length} planifiée{filteredSessions.length > 1 ? 's' : ''} | {filteredActivities.length} réalisée{filteredActivities.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              {selectedAthleteId && (
                <div className="upload-gpx-section">
                  <label htmlFor="gpx-upload" className="btn-upload-gpx">
                    📤 Importer GPX/FIT
                  </label>
                  <input
                    id="gpx-upload"
                    type="file"
                    accept=".gpx,.fit,.tcx"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingGPX}
                  />
                  {uploadingGPX && <span className="uploading-indicator">⏳ Import en cours...</span>}
                  
                  <AddActivityForm 
                    athletes={athletes} 
                    onActivityAdded={loadData}
                    preselectedAthleteId={selectedAthleteId}
                  />
                </div>
              )}
            </div>
            
            <div className="dual-calendar-view">
              <div className="calendar-column">
                <Calendar sessions={filteredSessions} athletes={athletes} />
              </div>
              <div className="calendar-column">
                <CompletedActivitiesCalendar activities={filteredActivities} athletes={athletes} />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'athletes' && <AthleteList athletes={athletes} />}
        {activeTab === 'sessions' && (
          <div className="sessions-view">
            <div className="sessions-header">
              <h2>Gérer les séances</h2>
              <button 
                className="btn-create-advanced-session" 
                onClick={() => window.location.href = '/sessions/new'}
              >
                ✨ Créer une séance avancée
              </button>
            </div>
            <SessionForm onSessionCreated={handleSessionCreated} athletes={athletes} />
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-card">
                  <h3>{session.title}</h3>
                  <p>{session.description}</p>
                  <p>Durée: {session.duration} min | Intensité: {session.intensity}</p>
                  <p>Date: {new Date(session.start_date).toLocaleDateString('fr-FR')}</p>
                </div>
              ))}
            </div>
            <div className="gpx-upload">
              <label htmlFor="gpx-upload-input">Importer un fichier GPX :</label>
              <input
                type="file"
                id="gpx-upload-input"
                accept=".gpx"
                onChange={handleFileUpload}
                disabled={uploadingGPX}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CoachDashboard;
