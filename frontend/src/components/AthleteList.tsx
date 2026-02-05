import { useState } from 'react';
import { Athlete } from '../types/index';
import AthleteMetrics from './AthleteMetrics';

interface AthleteListProps {
  athletes: Athlete[];
  onAthleteUpdate?: (updatedAthlete: Athlete) => void;
}

function AthleteList({ athletes, onAthleteUpdate }: AthleteListProps) {
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  const handleMetricsUpdate = (updatedAthlete: Athlete) => {
    if (onAthleteUpdate) {
      onAthleteUpdate(updatedAthlete);
    }
    setSelectedAthlete(null);
  };

  return (
    <div className="athlete-list">
      <h2>Your Athletes</h2>
      {athletes.length === 0 ? (
        <p>No athletes yet.</p>
      ) : (
        <div className="athletes-grid">
          {athletes.map((athlete) => (
            <div key={athlete.id} className="athlete-card">
              <h3>{athlete.name}</h3>
              <p>Email: {athlete.email}</p>
              <p>Age: {athlete.age || 'N/A'}</p>
              <p>Level: {athlete.level || 'N/A'}</p>
              <p>Goals: {athlete.goals || 'N/A'}</p>
              
              {/* Metrics Summary */}
              <div className="athlete-metrics-summary">
                {athlete.max_heart_rate && <span>❤️ {athlete.max_heart_rate} bpm</span>}
                {athlete.vma && <span>🏃 VMA: {athlete.vma} km/h</span>}
                {athlete.weight && <span>⚖️ {athlete.weight} kg</span>}
              </div>

              <button 
                className="metrics-button"
                onClick={() => setSelectedAthlete(athlete)}
              >
                ⚙️ Gérer les métriques
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedAthlete && (
        <AthleteMetrics
          athlete={selectedAthlete}
          onUpdate={handleMetricsUpdate}
          onClose={() => setSelectedAthlete(null)}
        />
      )}
    </div>
  );
}

export default AthleteList;
