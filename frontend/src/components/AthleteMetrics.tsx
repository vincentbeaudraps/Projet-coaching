import React, { useState, useEffect } from 'react';
import { Athlete, AthleteMetricsHistory } from '../types/index';
import '../styles/AthleteMetrics.css';

interface AthleteMetricsProps {
  athlete: Athlete;
  onUpdate: (updatedAthlete: Athlete) => void;
  onClose: () => void;
}

const AthleteMetrics: React.FC<AthleteMetricsProps> = ({ athlete, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    max_heart_rate: athlete.max_heart_rate || '',
    vma: athlete.vma || '',
    resting_heart_rate: athlete.resting_heart_rate || '',
    weight: athlete.weight || '',
    vo2max: athlete.vo2max || '',
    lactate_threshold_pace: athlete.lactate_threshold_pace || '',
  });
  const [history, setHistory] = useState<AthleteMetricsHistory[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [athlete.id]);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/athletes/${athlete.id}/metrics-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error loading metrics history:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/athletes/${athlete.id}/metrics`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          notes: notes.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update metrics');
      }

      const updatedAthlete = await response.json();
      onUpdate(updatedAthlete);
      setNotes('');
      await loadHistory();
      alert('Métriques mises à jour avec succès !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const calculateTrainingZones = () => {
    if (!formData.max_heart_rate) return null;
    
    const maxHR = Number(formData.max_heart_rate);
    const restingHR = Number(formData.resting_heart_rate) || 60;
    
    // Zones based on % of HRR (Heart Rate Reserve)
    const hrr = maxHR - restingHR;
    
    return {
      recovery: {
        min: Math.round(restingHR + hrr * 0.5),
        max: Math.round(restingHR + hrr * 0.6),
        name: 'Récupération',
        percent: '50-60%'
      },
      endurance: {
        min: Math.round(restingHR + hrr * 0.6),
        max: Math.round(restingHR + hrr * 0.75),
        name: 'Endurance fondamentale',
        percent: '60-75%'
      },
      tempo: {
        min: Math.round(restingHR + hrr * 0.75),
        max: Math.round(restingHR + hrr * 0.85),
        name: 'Tempo',
        percent: '75-85%'
      },
      threshold: {
        min: Math.round(restingHR + hrr * 0.85),
        max: Math.round(restingHR + hrr * 0.92),
        name: 'Seuil',
        percent: '85-92%'
      },
      vo2max: {
        min: Math.round(restingHR + hrr * 0.92),
        max: maxHR,
        name: 'VO2 Max',
        percent: '92-100%'
      }
    };
  };

  const calculateVMAPaces = () => {
    if (!formData.vma) return null;
    
    const vma = Number(formData.vma);
    
    // Convert km/h to min/km pace
    const vmaToMinPerKm = (speed: number) => {
      const minPerKm = 60 / speed;
      const minutes = Math.floor(minPerKm);
      const seconds = Math.round((minPerKm - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    
    return {
      vma100: { pace: vmaToMinPerKm(vma), name: '100% VMA', speed: vma.toFixed(2) },
      vma95: { pace: vmaToMinPerKm(vma * 0.95), name: '95% VMA', speed: (vma * 0.95).toFixed(2) },
      vma85: { pace: vmaToMinPerKm(vma * 0.85), name: '85% VMA (Seuil)', speed: (vma * 0.85).toFixed(2) },
      vma75: { pace: vmaToMinPerKm(vma * 0.75), name: '75% VMA (Endurance)', speed: (vma * 0.75).toFixed(2) },
      vma65: { pace: vmaToMinPerKm(vma * 0.65), name: '65% VMA (Récup)', speed: (vma * 0.65).toFixed(2) },
    };
  };

  const zones = calculateTrainingZones();
  const vmaPaces = calculateVMAPaces();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="athlete-metrics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Métriques de {athlete.name}</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="metrics-content">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="metrics-form">
            <div className="metrics-grid">
              {/* Cardiac Metrics */}
              <div className="metric-section">
                <h3>❤️ Données Cardiaques</h3>
                <div className="form-group">
                  <label htmlFor="max_heart_rate">
                    FC Max (bpm)
                    <span className="info-tooltip" title="Fréquence cardiaque maximale">ⓘ</span>
                  </label>
                  <input
                    type="number"
                    id="max_heart_rate"
                    name="max_heart_rate"
                    value={formData.max_heart_rate}
                    onChange={handleChange}
                    placeholder="180"
                    min="100"
                    max="220"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="resting_heart_rate">
                    FC Repos (bpm)
                    <span className="info-tooltip" title="Fréquence cardiaque au repos">ⓘ</span>
                  </label>
                  <input
                    type="number"
                    id="resting_heart_rate"
                    name="resting_heart_rate"
                    value={formData.resting_heart_rate}
                    onChange={handleChange}
                    placeholder="60"
                    min="30"
                    max="100"
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="metric-section">
                <h3>🏃 Performance</h3>
                <div className="form-group">
                  <label htmlFor="vma">
                    VMA (km/h)
                    <span className="info-tooltip" title="Vitesse Maximale Aérobie">ⓘ</span>
                  </label>
                  <input
                    type="number"
                    id="vma"
                    name="vma"
                    value={formData.vma}
                    onChange={handleChange}
                    placeholder="16.5"
                    step="0.1"
                    min="8"
                    max="25"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vo2max">
                    VO2 Max (ml/kg/min)
                    <span className="info-tooltip" title="Consommation maximale d'oxygène">ⓘ</span>
                  </label>
                  <input
                    type="number"
                    id="vo2max"
                    name="vo2max"
                    value={formData.vo2max}
                    onChange={handleChange}
                    placeholder="55.0"
                    step="0.1"
                    min="20"
                    max="90"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lactate_threshold_pace">
                    Allure Seuil (min/km)
                    <span className="info-tooltip" title="Allure au seuil lactique">ⓘ</span>
                  </label>
                  <input
                    type="text"
                    id="lactate_threshold_pace"
                    name="lactate_threshold_pace"
                    value={formData.lactate_threshold_pace}
                    onChange={handleChange}
                    placeholder="4:30"
                    pattern="[0-9]{1,2}:[0-5][0-9]"
                  />
                </div>
              </div>

              {/* Physical Metrics */}
              <div className="metric-section">
                <h3>⚖️ Physique</h3>
                <div className="form-group">
                  <label htmlFor="weight">
                    Poids (kg)
                    <span className="info-tooltip" title="Poids corporel en kilogrammes">ⓘ</span>
                  </label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="72.5"
                    step="0.1"
                    min="30"
                    max="200"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="metric-section full-width">
                <h3>📝 Notes</h3>
                <div className="form-group">
                  <textarea
                    id="notes"
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes sur cette mise à jour des métriques..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Enregistrement...' : '💾 Enregistrer les métriques'}
            </button>
          </form>

          {/* Training Zones Display */}
          {zones && (
            <div className="zones-display">
              <h3>❤️ Zones d'Entraînement Cardiaques</h3>
              <div className="zones-grid">
                {Object.entries(zones).map(([key, zone]) => (
                  <div key={key} className={`zone-card zone-${key}`}>
                    <div className="zone-name">{zone.name}</div>
                    <div className="zone-range">{zone.min} - {zone.max} bpm</div>
                    <div className="zone-percent">{zone.percent}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VMA Paces Display */}
          {vmaPaces && (
            <div className="paces-display">
              <h3>🏃 Allures d'Entraînement (VMA)</h3>
              <div className="paces-grid">
                {Object.entries(vmaPaces).map(([key, pace]) => (
                  <div key={key} className="pace-card">
                    <div className="pace-name">{pace.name}</div>
                    <div className="pace-value">{pace.pace} /km</div>
                    <div className="pace-speed">{pace.speed} km/h</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Section */}
          <div className="history-section">
            <button
              className="toggle-history-button"
              onClick={() => setShowHistory(!showHistory)}
            >
              📊 {showHistory ? 'Masquer' : 'Afficher'} l'historique ({history.length})
            </button>

            {showHistory && (
              <div className="history-list">
                {history.length === 0 ? (
                  <p className="no-history">Aucun historique disponible</p>
                ) : (
                  history.map((record) => (
                    <div key={record.id} className="history-item">
                      <div className="history-date">
                        {new Date(record.recorded_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="history-metrics">
                        {record.max_heart_rate && <span>FC Max: {record.max_heart_rate} bpm</span>}
                        {record.vma && <span>VMA: {record.vma} km/h</span>}
                        {record.weight && <span>Poids: {record.weight} kg</span>}
                        {record.vo2max && <span>VO2: {record.vo2max}</span>}
                      </div>
                      {record.notes && <div className="history-notes">{record.notes}</div>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteMetrics;
