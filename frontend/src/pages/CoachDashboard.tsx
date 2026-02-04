import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { sessionsService, athletesService } from '../services/api';
import { TrainingSession, Athlete } from '../types/index';
import Calendar from '../components/Calendar';
import SessionForm from '../components/SessionForm';
import AthleteList from '../components/AthleteList';
import Dashboard from '../components/Dashboard';
import '../styles/Dashboard.css';

function CoachDashboard() {
  const user = useAuthStore((state) => state.user);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'athletes' | 'sessions'>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [athletesRes, sessionsRes] = await Promise.all([
        athletesService.getAll(),
        sessionsService.getAll(),
      ]);
      setAthletes(athletesRes.data);
      setSessions(sessionsRes.data);
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

  const handleLogout = () => {
    useAuthStore.setState({ user: null, token: null });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Coach Dashboard</h1>
        <div className="user-info">
          <span>{user?.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Overview
        </button>
        <button
          className={activeTab === 'calendar' ? 'active' : ''}
          onClick={() => setActiveTab('calendar')}
        >
          📅 Calendar
        </button>
        <button
          className={activeTab === 'athletes' ? 'active' : ''}
          onClick={() => setActiveTab('athletes')}
        >
          🏃 Athletes
        </button>
        <button
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          🎯 Sessions
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'dashboard' && <Dashboard athletes={athletes} sessions={sessions} />}
        {activeTab === 'calendar' && <Calendar sessions={sessions} />}
        {activeTab === 'athletes' && <AthleteList athletes={athletes} />}
        {activeTab === 'sessions' && (
          <div className="sessions-view">
            <SessionForm onSessionCreated={handleSessionCreated} athletes={athletes} />
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-card">
                  <h3>{session.title}</h3>
                  <p>{session.description}</p>
                  <p>Duration: {session.duration} min | Intensity: {session.intensity}</p>
                  <p>Date: {new Date(session.start_date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CoachDashboard;
