import { useState } from 'react';
import { sessionsService, athletesService, activitiesService } from '../services/api';
import { TrainingSession, Athlete, CompletedActivity } from '../types/index';
import { showSuccess, showError, showWarning } from '../utils/toast.tsx';
import Header from '../components/Header';
import Calendar from '../components/Calendar';
import CompletedActivitiesCalendar from '../components/CompletedActivitiesCalendar';
import AddActivityForm from '../components/AddActivityForm';
import Dashboard from '../components/Dashboard';
import { useApi } from '../hooks/useApi';
// import SessionFilters, { SessionFilters as FilterType } from '../components/SessionFilters';
// import { useSessionFilters } from '../hooks/useSessionFilters';
import '../styles/Dashboard.css';

function CoachDashboard() {
  const { data: athletes, loading: loadingAthletes, refetch: refetchAthletes } = useApi<Athlete[]>(
    () => athletesService.getAll().then(res => res.data),
    []
  );
  
  const { data: sessions, loading: loadingSessions, refetch: refetchSessions } = useApi<TrainingSession[]>(
    () => sessionsService.getAll().then(res => res.data),
    []
  );
  
  const { data: activities, loading: loadingActivities, refetch: refetchActivities } = useApi<CompletedActivity[]>(
    () => activitiesService.getAllForCoach().then(res => res.data),
    []
  );
  
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [uploadingGPX, setUploadingGPX] = useState(false);
  
  const loading = loadingAthletes || loadingSessions || loadingActivities;

  const loadData = async () => {
    await Promise.all([refetchAthletes(), refetchSessions(), refetchActivities()]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAthleteId) {
      showWarning('Veuillez sélectionner un athlète et un fichier GPX');
      return;
    }

    setUploadingGPX(true);
    try {
      await activitiesService.uploadGPX(file, selectedAthleteId);
      await loadData();
      showSuccess('Activité importée avec succès');
    } catch (error) {
      console.error('Error uploading GPX:', error);
      showError('Erreur lors de l\'import du fichier GPX', error as Error);
    } finally {
      setUploadingGPX(false);
      event.target.value = '';
    }
  };

  // Filtrer les séances selon l'athlète sélectionné
  const filteredSessions = selectedAthleteId
    ? (sessions || []).filter((session) => session.athlete_id === selectedAthleteId)
    : (sessions || []);

  const filteredActivities = selectedAthleteId
    ? (activities || []).filter((activity) => activity.athlete_id === selectedAthleteId)
    : (activities || []);

  const selectedAthlete = athletes?.find((a) => a.id === selectedAthleteId);

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
        <Dashboard athletes={athletes || []} sessions={sessions || []} />
        
        <div className="calendar-section">
          <h2 className="section-title">📅 Calendrier des Séances</h2>
          
          <div className="athlete-selector">
            <label htmlFor="athlete-select">Filtrer par athlète :</label>
            <select
              id="athlete-select"
              value={selectedAthleteId || ''}
              onChange={(e) => setSelectedAthleteId(e.target.value || null)}
              className="athlete-select-dropdown"
            >
              <option value="">Tous les athlètes</option>
              {(athletes || []).map((athlete) => {
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
                  athletes={athletes || []} 
                  onActivityAdded={loadData}
                  preselectedAthleteId={selectedAthleteId}
                />
              </div>
            )}
          </div>
          
          <div className="dual-calendar-view">
            <div className="calendar-column">
              <Calendar 
                sessions={filteredSessions} 
                athletes={athletes || undefined} 
                setSessions={async () => { await refetchSessions(); }} 
              />
            </div>
            <div className="calendar-column">
              <CompletedActivitiesCalendar 
                activities={filteredActivities} 
                athletes={athletes || undefined} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoachDashboard;
