import { useMemo } from 'react';
import { calculateHeartRateZones, calculateVMAZones, speedToPace } from '../utils/trainingZones';
import '../styles/TrainingZones.css';

interface TrainingZonesProps {
  fcMax?: number;
  fcRepos?: number;
  vma?: number;
}

function TrainingZones({ fcMax, fcRepos, vma }: TrainingZonesProps) {
  const hrZones = useMemo(() => {
    return fcMax ? calculateHeartRateZones(fcMax) : [];
  }, [fcMax]);

  const vmaZones = useMemo(() => {
    return vma ? calculateVMAZones(vma) : [];
  }, [vma]);

  if (!fcMax && !vma) {
    return (
      <div className="training-zones-empty">
        <p>Aucune donnée physiologique disponible pour calculer les zones d'entraînement.</p>
        <p>Veuillez renseigner la FC MAX et/ou la VMA dans les métriques.</p>
      </div>
    );
  }

  return (
    <div className="training-zones-container">
      {fcMax && hrZones.length > 0 && (
        <div className="zones-section">
          <h3>Zones Cardiaques</h3>
          <p className="zones-subtitle">
            Basées sur FC MAX : <strong>{fcMax} bpm</strong>
            {fcRepos && (
              <> • FC Repos : <strong>{fcRepos} bpm</strong></>
            )}
          </p>
          <div className="zones-grid">
            {hrZones.map((zone) => (
              <div key={zone.zone} className={`zone-card zone-${zone.zone}`}>
                <div className="zone-header">
                  <span className="zone-number">Zone {zone.zone}</span>
                  <span className="zone-percentage">{zone.percentage}</span>
                </div>
                <div className="zone-name">{zone.name}</div>
                <div className="zone-range">
                  {zone.min} - {zone.max} bpm
                </div>
                <div className="zone-description">{zone.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vma && vmaZones.length > 0 && (
        <div className="zones-section">
          <h3>Zones VMA</h3>
          <p className="zones-subtitle">
            Basées sur VMA : <strong>{vma} km/h</strong>
          </p>
          <div className="zones-grid">
            {vmaZones.map((zone) => (
              <div key={zone.zone} className={`zone-card zone-${zone.zone}`}>
                <div className="zone-header">
                  <span className="zone-number">Zone {zone.zone}</span>
                  <span className="zone-percentage">{zone.percentage}</span>
                </div>
                <div className="zone-name">{zone.name}</div>
                <div className="zone-range">
                  {zone.minSpeed.toFixed(2)} - {zone.maxSpeed.toFixed(2)} km/h
                </div>
                <div className="zone-pace">
                  {speedToPace(zone.maxSpeed)} - {speedToPace(zone.minSpeed)} /km
                </div>
                <div className="zone-description">{zone.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingZones;
