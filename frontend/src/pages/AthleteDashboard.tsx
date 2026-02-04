import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { sessionsService, performanceService } from '../services/api';
import { TrainingSession, Performance } from '../types/index';
import '../styles/Dashboard.css';

function AthleteDashboard() {
  const user = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [activeTab, setActiveTab] = useState<'sessions' | 'performance' | 'messages'>('sessions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Note: Cette route devrait retourner les sessions de l'athlète
      const [sessionsRes, performanceRes] = await Promise.all([
        sessionsService.getAll(),
        performanceService.getForAthlete(user?.id || ''),
      ]);
      setSessions(sessionsRes.data);
      setPerformance(performanceRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
        <h1>Athlete Dashboard</h1>
        <div className="user-info">
          <span>{user?.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          📅 Sessions
        </button>
        <button
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          📊 Performance
        </button>
        <button
          className={activeTab === 'messages' ? 'active' : ''}
          onClick={() => setActiveTab('messages')}
        >
          💬 Messages
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'sessions' && (
          <div className="sessions-view">
            <h2>Upcoming Sessions</h2>
            {sessions.length === 0 ? (
              <p>No sessions planned yet.</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="session-card">
                  <h3>{session.title}</h3>
                  <p>{session.description}</p>
                  <p>Duration: {session.duration} min | Intensity: {session.intensity}</p>
                  <p>Date: {new Date(session.start_date).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-view">
            <h2>Performance History</h2>
            {performance.length === 0 ? (
              <p>No performance records yet.</p>
            ) : (
              performance.map((record) => (
                <div key={record.id} className="performance-card">
                  <p>Duration: {record.actual_duration} min</p>
                  {record.actual_distance && <p>Distance: {record.actual_distance} km</p>}
                  {record.avg_heart_rate && <p>Avg HR: {record.avg_heart_rate} bpm</p>}
                  <p>Date: {new Date(record.recorded_at).toLocaleDateString()}</p>
                  {record.notes && <p>Notes: {record.notes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="messages-view">
            <h2>Messages</h2>
            <p>Message feature coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default AthleteDashboard;
