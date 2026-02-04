import { TrainingSession, Athlete } from '../types/index';

interface DashboardProps {
  athletes: Athlete[];
  sessions: TrainingSession[];
}

function Dashboard({ athletes, sessions }: DashboardProps) {
  const upcomingSessions = sessions.filter(
    (s) => new Date(s.start_date) > new Date()
  ).length;

  const todaySessions = sessions.filter((s) => {
    const sessionDate = new Date(s.start_date);
    const today = new Date();
    return (
      sessionDate.getDate() === today.getDate() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getFullYear() === today.getFullYear()
    );
  }).length;

  return (
    <div className="dashboard-overview">
      <h2>Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Athletes</h4>
          <p className="stat-number">{athletes.length}</p>
        </div>
        <div className="stat-card">
          <h4>Total Sessions</h4>
          <p className="stat-number">{sessions.length}</p>
        </div>
        <div className="stat-card">
          <h4>Upcoming Sessions</h4>
          <p className="stat-number">{upcomingSessions}</p>
        </div>
        <div className="stat-card">
          <h4>Today's Sessions</h4>
          <p className="stat-number">{todaySessions}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
