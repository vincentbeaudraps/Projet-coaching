import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { athletesService } from '../services/api';
import { showError } from '../utils/toast';
import Header from '../components/Header';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  ComposedChart, Bar
} from 'recharts';
import '../styles/CoachAthleteDetail.css';

interface Athlete {
  id: string;
  first_name?: string;
  last_name?: string;
  user_name?: string;
  age?: number;
  vma?: number;
  max_heart_rate?: number;
}

interface WeeklyLoad {
  week: string;
  sessions_count: number;
  distance_km: number;
  duration_seconds: number;
  avg_hr: number;
  total_elevation: number;
  trimp_load?: number;
  session_rpe_load?: number;
  combined_load?: number;
}

interface Activity {
  id: string;
  date: string;
  activity_type: string;
  distance_km: number;
  duration_seconds: number;
  avg_pace?: string;
  avg_heart_rate?: number;
  perceived_effort?: number;
  notes?: string;
}

interface Performance {
  id: string;
  distance_type: string;
  distance_km: number;
  time_seconds: number;
  pace: string;
  race_name?: string;
  date_achieved: string;
  vdot?: number;
}

interface Anomaly {
  type: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  value?: string;
}

interface DetailedStats {
  weeklyLoad: WeeklyLoad[];
  recentActivities: Activity[];
  performances: Performance[];
  globalStats: {
    total_activities: number;
    total_distance: number;
    total_duration: number;
    avg_distance: number;
    avg_hr: number;
    activities_last_7_days: number;
    activities_last_30_days: number;
  };
  zoneDistribution: Array<{
    training_zone: string;
    count: number;
    total_distance: number;
    total_duration: number;
  }>;
  anomalies: Anomaly[];
}

function CoachAthleteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'load' | 'activities' | 'performance'>('overview');
  const [weeksFilter, setWeeksFilter] = useState(12);

  useEffect(() => {
    loadAthleteData();
  }, [id, weeksFilter]);

  const loadAthleteData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [athleteRes, statsRes] = await Promise.all([
        athletesService.getById(id),
        athletesService.getDetailedStats(id, weeksFilter)
      ]);

      setAthlete(athleteRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading athlete data:', error);
      showError('Erreur lors du chargement des données', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}min`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getAthleteName = (): string => {
    if (!athlete) return 'Athlète';
    if (athlete.first_name && athlete.last_name) {
      return `${athlete.first_name} ${athlete.last_name}`;
    }
    return athlete.user_name || 'Athlète';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'danger': return '#e74c3c';
      case 'warning': return '#f39c12';
      case 'info': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'danger': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '●';
    }
  };

  const ZONE_COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'];

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <Header />
        <div className="dashboard-container">
          <div className="loading">Chargement des données...</div>
        </div>
      </div>
    );
  }

  if (!athlete || !stats) {
    return (
      <div className="dashboard-wrapper">
        <Header />
        <div className="dashboard-container">
          <div className="error-message">Athlète non trouvé</div>
          <button onClick={() => navigate('/athletes')} className="btn-back">
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Header />
      
      <div className="coach-athlete-detail-container">
        {/* En-tête avec infos athlète */}
        <div className="athlete-header">
          <button onClick={() => navigate('/athletes')} className="btn-back">
            ← Retour
          </button>
          <div className="athlete-header-info">
            <div className="athlete-avatar">
              {getAthleteName().charAt(0).toUpperCase()}
            </div>
            <div className="athlete-header-text">
              <h1>{getAthleteName()}</h1>
              <div className="athlete-meta">
                {athlete.age && <span>🎂 {athlete.age} ans</span>}
                {athlete.vma && <span>⚡ VMA: {athlete.vma} km/h</span>}
                {athlete.max_heart_rate && <span>❤️ FC Max: {athlete.max_heart_rate} bpm</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Alertes et anomalies */}
        {stats.anomalies.length > 0 && (
          <div className="anomalies-section">
            <h3>🚨 Alertes et Anomalies</h3>
            <div className="anomalies-grid">
              {stats.anomalies.map((anomaly, idx) => (
                <div 
                  key={idx} 
                  className={`anomaly-card anomaly-${anomaly.severity}`}
                  style={{ borderLeftColor: getSeverityColor(anomaly.severity) }}
                >
                  <div className="anomaly-icon">{getSeverityIcon(anomaly.severity)}</div>
                  <div className="anomaly-content">
                    <div className="anomaly-message">{anomaly.message}</div>
                    {anomaly.value && <div className="anomaly-value">{anomaly.value}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistiques globales */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">🏃</div>
            <div className="stat-content">
              <div className="stat-label">Activités totales</div>
              <div className="stat-value">{stats.globalStats.total_activities || 0}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📏</div>
            <div className="stat-content">
              <div className="stat-label">Distance totale</div>
              <div className="stat-value">{Number(stats.globalStats.total_distance || 0).toFixed(0)} km</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-label">Temps total</div>
              <div className="stat-value">{formatDuration(Number(stats.globalStats.total_duration || 0))}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❤️</div>
            <div className="stat-content">
              <div className="stat-label">FC moyenne</div>
              <div className="stat-value">{Number(stats.globalStats.avg_hr || 0)} bpm</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-label">7 derniers jours</div>
              <div className="stat-value">{Number(stats.globalStats.activities_last_7_days || 0)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Distance moyenne</div>
              <div className="stat-value">{Number(stats.globalStats.avg_distance || 0).toFixed(1)} km</div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Vue d'ensemble
            </button>
            <button 
              className={`tab ${activeTab === 'load' ? 'active' : ''}`}
              onClick={() => setActiveTab('load')}
            >
              📈 Charge d'entraînement
            </button>
            <button 
              className={`tab ${activeTab === 'activities' ? 'active' : ''}`}
              onClick={() => setActiveTab('activities')}
            >
              🏃 Activités récentes
            </button>
            <button 
              className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              🏆 Performances
            </button>
          </div>

          {/* Filtre de période */}
          {activeTab === 'load' && (
            <div className="weeks-filter">
              <label>Période:</label>
              <select value={weeksFilter} onChange={(e) => setWeeksFilter(Number(e.target.value))}>
                <option value={4}>4 semaines</option>
                <option value={8}>8 semaines</option>
                <option value={12}>12 semaines</option>
                <option value={24}>24 semaines</option>
              </select>
            </div>
          )}
        </div>

        {/* Contenu des onglets */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-grid">
              {/* Graphique de distribution par zone */}
              {stats.zoneDistribution.length > 0 && (
                <div className="chart-card">
                  <h3>Répartition par Zone d'Entraînement (30 derniers jours)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.zoneDistribution}
                        dataKey="count"
                        nameKey="training_zone"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `Zone ${entry.training_zone}: ${entry.count}`}
                      >
                        {stats.zoneDistribution.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={ZONE_COLORS[index % ZONE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Charge hebdomadaire scientifique */}
              <div className="chart-card">
                <h3>📊 Charge d'Entraînement Scientifique</h3>
                <p className="chart-subtitle">TRIMP + Session RPE (Foster & Banister)</p>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={stats.weeklyLoad.slice(0, 8).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tickFormatter={(value) => formatDate(value)} />
                    <YAxis yAxisId="left" label={{ value: 'Charge', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Distance (km)', angle: 90, position: 'insideRight' }} />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value)}
                      formatter={(value: any, name: string) => {
                        if (name === 'distance_km') return [`${Number(value).toFixed(1)} km`, 'Distance'];
                        if (name === 'combined_load') return [`${Number(value).toFixed(0)} pts`, 'Charge Combinée'];
                        if (name === 'trimp_load') return [`${Number(value).toFixed(0)} pts`, 'TRIMP'];
                        if (name === 'session_rpe_load') return [`${Number(value).toFixed(0)} pts`, 'Session RPE'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="combined_load" fill="#e74c3c" name="Charge Combinée" />
                    <Line yAxisId="right" type="monotone" dataKey="distance_km" stroke="#3498db" strokeWidth={2} name="Distance" />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="chart-legend-info">
                  <span>🔴 Charge Combinée = (TRIMP + Session RPE) / 2</span>
                  <span>📘 Basé sur FC, durée et effort perçu</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'load' && (
            <div className="load-analysis">
              {/* Graphique de charge hebdomadaire */}
              <div className="chart-card">
                <h3>Distance Hebdomadaire</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={[...stats.weeklyLoad].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tickFormatter={(value) => formatDate(value)} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value)}
                      formatter={(value: any) => [`${Number(value).toFixed(1)} km`, 'Distance']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="distance_km" 
                      stroke="#3498db" 
                      strokeWidth={2}
                      name="Distance (km)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Graphique de fréquence cardiaque */}
              <div className="chart-card">
                <h3>Fréquence Cardiaque Moyenne</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={[...stats.weeklyLoad].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tickFormatter={(value) => formatDate(value)} />
                    <YAxis domain={[130, 180]} />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value)}
                      formatter={(value: any) => [`${Number(value).toFixed(0)} bpm`, 'FC Moyenne']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avg_hr" 
                      stroke="#e74c3c" 
                      strokeWidth={2}
                      name="FC Moyenne (bpm)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Tableau de charge détaillée scientifique */}
              <div className="chart-card">
                <h3>📊 Détail de la Charge Scientifique Hebdomadaire</h3>
                <div className="load-table-container">
                  <table className="load-table">
                    <thead>
                      <tr>
                        <th>Semaine</th>
                        <th>Séances</th>
                        <th>Distance</th>
                        <th>Durée</th>
                        <th>TRIMP</th>
                        <th>Session RPE</th>
                        <th>Charge Total</th>
                        <th>FC Moy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.weeklyLoad.map((week) => (
                        <tr key={week.week}>
                          <td>{formatDate(week.week)}</td>
                          <td>{week.sessions_count}</td>
                          <td>{Number(week.distance_km || 0).toFixed(1)} km</td>
                          <td>{formatDuration(Number(week.duration_seconds || 0))}</td>
                          <td><strong style={{color: '#e67e22'}}>{Number(week.trimp_load || 0).toFixed(0)}</strong></td>
                          <td><strong style={{color: '#9b59b6'}}>{Number(week.session_rpe_load || 0).toFixed(0)}</strong></td>
                          <td><strong style={{color: '#e74c3c'}}>{Number(week.combined_load || 0).toFixed(0)}</strong></td>
                          <td>{week.avg_hr ? `${week.avg_hr} bpm` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="table-legend">
                  <p><strong>TRIMP</strong> = Training Impulse (Banister) - Basé sur FC et durée</p>
                  <p><strong>Session RPE</strong> = Rate of Perceived Exertion (Foster) - Durée × Effort perçu</p>
                  <p><strong>Charge Total</strong> = Moyenne des deux méthodes</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="activities-list">
              <h3>Activités des 30 Derniers Jours</h3>
              {stats.recentActivities.length === 0 ? (
                <div className="empty-state">Aucune activité récente</div>
              ) : (
                <div className="activities-grid">
                  {stats.recentActivities.map((activity) => (
                    <div key={activity.id} className="activity-card">
                      <div className="activity-header">
                        <span className="activity-type">{activity.activity_type}</span>
                        <span className="activity-date">{new Date(activity.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="activity-stats">
                        <div className="activity-stat">
                          <span className="stat-label">Distance</span>
                          <span className="stat-value">{Number(activity.distance_km || 0).toFixed(2)} km</span>
                        </div>
                        <div className="activity-stat">
                          <span className="stat-label">Durée</span>
                          <span className="stat-value">{formatDuration(Number(activity.duration_seconds || 0))}</span>
                        </div>
                        {activity.avg_pace && (
                          <div className="activity-stat">
                            <span className="stat-label">Allure</span>
                            <span className="stat-value">{activity.avg_pace}</span>
                          </div>
                        )}
                        {activity.avg_heart_rate && (
                          <div className="activity-stat">
                            <span className="stat-label">FC Moy</span>
                            <span className="stat-value">{activity.avg_heart_rate} bpm</span>
                          </div>
                        )}
                        {activity.perceived_effort && (
                          <div className="activity-stat">
                            <span className="stat-label">Effort ressenti</span>
                            <span className="stat-value">{activity.perceived_effort}/10</span>
                          </div>
                        )}
                      </div>
                      {activity.notes && (
                        <div className="activity-notes">
                          💬 {activity.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="performance-section">
              <h3>Records et Performances</h3>
              {stats.performances.length === 0 ? (
                <div className="empty-state">Aucune performance enregistrée</div>
              ) : (
                <div className="performances-table-container">
                  <table className="performances-table">
                    <thead>
                      <tr>
                        <th>Distance</th>
                        <th>Temps</th>
                        <th>Allure</th>
                        <th>VDOT</th>
                        <th>Course</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.performances.map((perf) => (
                        <tr key={perf.id}>
                          <td>{perf.distance_type}</td>
                          <td>{formatDuration(perf.time_seconds)}</td>
                          <td>{perf.pace}</td>
                          <td>{perf.vdot ? perf.vdot.toFixed(1) : '-'}</td>
                          <td>{perf.race_name || '-'}</td>
                          <td>{new Date(perf.date_achieved).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoachAthleteDetailPage;
