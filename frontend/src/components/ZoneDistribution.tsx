import { useMemo } from 'react';
import { calculateHeartRateZones, calculateVMAZones, getHeartRateZone, getVMAZone } from '../utils/trainingZones';
import '../styles/ZoneDistribution.css';

interface ZoneDistributionProps {
  // Données de l'activité
  avgHeartRate?: number;
  maxHeartRate?: number; // Reserved for future use with GPX analysis (unused for now)
  avgSpeed?: number;
  duration: number; // en minutes
  gpxData?: string;
  
  // Métriques de l'athlète
  athleteFcMax?: number;
  athleteVMA?: number;
}

interface ZoneTimeData {
  zone: number;
  name: string;
  time: number; // en minutes
  percentage: number;
  color: string;
}

function ZoneDistribution({
  avgHeartRate,
  avgSpeed,
  duration,
  gpxData,
  athleteFcMax,
  athleteVMA,
}: ZoneDistributionProps) {
  
  // Calcul de la distribution des zones FC
  const hrZoneDistribution = useMemo((): ZoneTimeData[] => {
    if (!athleteFcMax || (!avgHeartRate && !gpxData)) return [];
    
    const zones = calculateHeartRateZones(athleteFcMax);
    const colors = ['#48bb78', '#4299e1', '#ed8936', '#f56565', '#9f7aea'];
    
    // Pour l'instant, estimation simple basée sur FC moyenne
    // TODO: Analyser les données GPX pour une distribution précise
    if (avgHeartRate) {
      const mainZone = getHeartRateZone(avgHeartRate, zones);
      
      return zones.map((zone, idx) => ({
        zone: zone.zone,
        name: zone.name,
        time: zone.zone === mainZone ? duration * 0.7 : duration * 0.3 / (zones.length - 1),
        percentage: zone.zone === mainZone ? 70 : 30 / (zones.length - 1),
        color: colors[idx] || '#718096',
      }));
    }
    
    return [];
  }, [avgHeartRate, athleteFcMax, duration, gpxData]);

  // Calcul de la distribution des zones VMA
  const vmaZoneDistribution = useMemo((): ZoneTimeData[] => {
    if (!athleteVMA || (!avgSpeed && !gpxData)) return [];
    
    const zones = calculateVMAZones(athleteVMA);
    const colors = ['#48bb78', '#4299e1', '#ed8936', '#f56565', '#9f7aea', '#ed64a6'];
    
    // Estimation simple basée sur vitesse moyenne
    if (avgSpeed) {
      const mainZone = getVMAZone(avgSpeed, zones);
      
      return zones.map((zone, idx) => ({
        zone: zone.zone,
        name: zone.name,
        time: zone.zone === mainZone ? duration * 0.7 : duration * 0.3 / (zones.length - 1),
        percentage: zone.zone === mainZone ? 70 : 30 / (zones.length - 1),
        color: colors[idx] || '#718096',
      }));
    }
    
    return [];
  }, [avgSpeed, athleteVMA, duration, gpxData]);

  const formatTime = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes % 1) * 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}min`;
    }
    if (mins > 0) {
      return `${mins}min ${secs}s`;
    }
    return `${secs}s`;
  };

  if (hrZoneDistribution.length === 0 && vmaZoneDistribution.length === 0) {
    return (
      <div className="zone-distribution-empty">
        <p>Données insuffisantes pour calculer la distribution des zones.</p>
        <p className="help-text">
          Pour analyser les zones, l'activité doit contenir des données de fréquence cardiaque ou de vitesse,
          et l'athlète doit avoir ses métriques (FC MAX ou VMA) renseignées.
        </p>
      </div>
    );
  }

  return (
    <div className="zone-distribution-container">
      {hrZoneDistribution.length > 0 && (
        <div className="distribution-section">
          <h3>Distribution des Zones Cardiaques</h3>
          
          {/* Barre de progression */}
          <div className="zone-bar">
            {hrZoneDistribution.map((zone) => (
              zone.percentage > 0 && (
                <div
                  key={zone.zone}
                  className="zone-segment"
                  style={{
                    width: `${zone.percentage}%`,
                    backgroundColor: zone.color,
                  }}
                  title={`${zone.name}: ${formatTime(zone.time)} (${zone.percentage.toFixed(1)}%)`}
                />
              )
            ))}
          </div>

          {/* Détails des zones */}
          <div className="zone-details-grid">
            {hrZoneDistribution
              .filter(zone => zone.percentage > 1) // Afficher seulement les zones significatives
              .map((zone) => (
                <div key={zone.zone} className="zone-detail-card">
                  <div className="zone-color-badge" style={{ backgroundColor: zone.color }} />
                  <div className="zone-detail-content">
                    <div className="zone-detail-name">Zone {zone.zone} - {zone.name}</div>
                    <div className="zone-detail-stats">
                      <span className="zone-time">{formatTime(zone.time)}</span>
                      <span className="zone-percentage">{zone.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {vmaZoneDistribution.length > 0 && (
        <div className="distribution-section">
          <h3>Distribution des Zones VMA</h3>
          
          {/* Barre de progression */}
          <div className="zone-bar">
            {vmaZoneDistribution.map((zone) => (
              zone.percentage > 0 && (
                <div
                  key={zone.zone}
                  className="zone-segment"
                  style={{
                    width: `${zone.percentage}%`,
                    backgroundColor: zone.color,
                  }}
                  title={`${zone.name}: ${formatTime(zone.time)} (${zone.percentage.toFixed(1)}%)`}
                />
              )
            ))}
          </div>

          {/* Détails des zones */}
          <div className="zone-details-grid">
            {vmaZoneDistribution
              .filter(zone => zone.percentage > 1)
              .map((zone) => (
                <div key={zone.zone} className="zone-detail-card">
                  <div className="zone-color-badge" style={{ backgroundColor: zone.color }} />
                  <div className="zone-detail-content">
                    <div className="zone-detail-name">Zone {zone.zone} - {zone.name}</div>
                    <div className="zone-detail-stats">
                      <span className="zone-time">{formatTime(zone.time)}</span>
                      <span className="zone-percentage">{zone.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="distribution-note">
        <strong>Note:</strong> La distribution est actuellement calculée sur la base des moyennes.
        Pour une analyse plus précise, les données GPS/FC en temps réel sont nécessaires.
      </div>
    </div>
  );
}

export default ZoneDistribution;
