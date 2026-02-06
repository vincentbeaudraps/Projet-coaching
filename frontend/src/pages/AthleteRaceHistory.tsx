// filepath: frontend/src/pages/AthleteRaceHistory.tsx
import { useState, useEffect } from 'react';
import { athletesService } from '../services/api';
import { showError } from '../utils/toast';
import Header from '../components/Header';
import '../styles/AthleteRaceHistory.css';

interface PersonalRecord {
  id: string;
  distance_type: string;
  distance_km: number;
  time_seconds: number;
  pace: string;
  location?: string;
  race_name?: string;
  date_achieved: string;
  notes?: string;
}

export default function AthleteRaceHistory() {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistance, setSelectedDistance] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'vdot' | 'pace'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    filterAndSortRecords();
  }, [records, selectedDistance, selectedYear, sortBy, sortOrder]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await athletesService.getMyRecords();
      setRecords(res.data || []);
    } catch (error) {
      console.error('Error loading records:', error);
      showError('Erreur lors du chargement de l\'historique', error as Error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateVDOT = (timeSeconds: number, distanceKm: number): number => {
    const distanceMeters = distanceKm * 1000;
    const velocityMetersPerMin = distanceMeters / (timeSeconds / 60);
    
    const percentVO2max = 0.8 + 0.1894393 * Math.exp(-0.012778 * (timeSeconds / 60)) + 0.2989558 * Math.exp(-0.1932605 * (timeSeconds / 60));
    const vo2 = -4.60 + 0.182258 * velocityMetersPerMin + 0.000104 * Math.pow(velocityMetersPerMin, 2);
    const vdot = vo2 / percentVO2max;
    
    return Math.round(vdot * 10) / 10;
  };

  const filterAndSortRecords = () => {
    let filtered = [...records];

    // Filter by distance
    if (selectedDistance !== 'all') {
      filtered = filtered.filter(r => r.distance_type === selectedDistance);
    }

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(r => {
        const year = new Date(r.date_achieved).getFullYear().toString();
        return year === selectedYear;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.date_achieved).getTime() - new Date(b.date_achieved).getTime();
      } else if (sortBy === 'vdot') {
        const vdotA = calculateVDOT(a.time_seconds, a.distance_km);
        const vdotB = calculateVDOT(b.time_seconds, b.distance_km);
        comparison = vdotA - vdotB;
      } else if (sortBy === 'pace') {
        const paceA = a.time_seconds / a.distance_km;
        const paceB = b.time_seconds / b.distance_km;
        comparison = paceA - paceB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredRecords(filtered);
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
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getDistanceLabel = (distanceType: string): string => {
    const labels: { [key: string]: string } = {
      '5km': '5 km',
      '10km': '10 km',
      'half_marathon': 'Semi-Marathon',
      'marathon': 'Marathon',
      'custom': 'Autre'
    };
    return labels[distanceType] || distanceType;
  };

  const getDistanceBadgeColor = (distanceType: string): string => {
    const colors: { [key: string]: string } = {
      '5km': '#10b981',
      '10km': '#8b5cf6',
      'half_marathon': '#f59e0b',
      'marathon': '#ef4444',
      'custom': '#6b7280'
    };
    return colors[distanceType] || '#6b7280';
  };

  const getAvailableYears = (): string[] => {
    const years = new Set(records.map(r => new Date(r.date_achieved).getFullYear().toString()));
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };

  const handleSort = (newSortBy: 'date' | 'vdot' | 'pace') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getStats = () => {
    const totalRaces = filteredRecords.length;
    const avgVDOT = filteredRecords.length > 0
      ? filteredRecords.reduce((sum, r) => sum + calculateVDOT(r.time_seconds, r.distance_km), 0) / totalRaces
      : 0;
    const bestVDOT = filteredRecords.length > 0
      ? Math.max(...filteredRecords.map(r => calculateVDOT(r.time_seconds, r.distance_km)))
      : 0;
    const totalDistance = filteredRecords.reduce((sum, r) => sum + (Number(r.distance_km) || 0), 0);

    return { totalRaces, avgVDOT, bestVDOT, totalDistance };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <Header />
        <div className="race-history-container">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Header />
      
      <div className="race-history-container">
        <div className="page-header">
          <h1>📊 Historique des courses</h1>
          <p className="page-subtitle">{records.length} course{records.length > 1 ? 's' : ''} enregistrée{records.length > 1 ? 's' : ''}</p>
        </div>

        {/* Statistics Summary */}
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-icon">🏃</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalRaces}</div>
              <div className="stat-label">Courses</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{(stats.avgVDOT || 0).toFixed(1)}</div>
              <div className="stat-label">VDOT moyen</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-value">{(stats.bestVDOT || 0).toFixed(1)}</div>
              <div className="stat-label">Meilleur VDOT</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🗺️</div>
            <div className="stat-content">
              <div className="stat-value">{(stats.totalDistance || 0).toFixed(0)} km</div>
              <div className="stat-label">Distance totale</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-group">
            <label>Distance</label>
            <select value={selectedDistance} onChange={(e) => setSelectedDistance(e.target.value)}>
              <option value="all">Toutes les distances</option>
              <option value="5km">5 km</option>
              <option value="10km">10 km</option>
              <option value="half_marathon">Semi-Marathon</option>
              <option value="marathon">Marathon</option>
              <option value="custom">Autre</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Année</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">Toutes les années</option>
              {getAvailableYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="race-history-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Résultats</th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('pace')}
                >
                  Pace {sortBy === 'pace' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('date')}
                >
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Distance</th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('vdot')}
                >
                  VDOT {sortBy === 'vdot' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="no-data">
                    Aucune course trouvée
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  const vdot = calculateVDOT(record.time_seconds, record.distance_km);
                  return (
                    <tr key={record.id}>
                      <td className="race-name-cell">
                        {record.race_name || 'Course sans nom'}
                        {record.location && (
                          <div className="race-location-small">📍 {record.location}</div>
                        )}
                      </td>
                      <td className="result-cell">{formatTime(record.time_seconds)}</td>
                      <td className="pace-cell">{record.pace}/km</td>
                      <td className="date-cell">{formatDate(record.date_achieved)}</td>
                      <td>
                        <span 
                          className="distance-badge" 
                          style={{ backgroundColor: getDistanceBadgeColor(record.distance_type) }}
                        >
                          {getDistanceLabel(record.distance_type)}
                        </span>
                      </td>
                      <td className="vdot-cell">{vdot}</td>
                      <td className="note-cell">
                        {record.notes ? (
                          <span title={record.notes}>📝</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="actions-cell">
                        <button className="btn-icon" title="Modifier">✏️</button>
                        <button className="btn-icon" title="Supprimer">🗑️</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        {filteredRecords.length > 0 && (
          <div className="pagination-info">
            <p>
              Affichage de {filteredRecords.length} sur {records.length} course{records.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
