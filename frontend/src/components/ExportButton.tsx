import React, { useState } from 'react';
import '../styles/ExportButton.css';
import { exportWeeklyReport, exportAthleteProfile, exportTrainingPlan } from '../utils/pdfExport';

interface Athlete {
  id: string;
  name: string;
  email: string;
  age?: number;
  vma?: number;
  fcMax?: number;
  weight?: number;
  height?: number;
}

interface Session {
  id: string;
  title: string;
  type?: string;
  distance?: number;
  duration: number;
  intensity?: string;
  startDate: string;
  notes?: string;
}

interface Activity {
  id: string;
  type: string;
  distance: number;
  duration: number;
  avgPace?: string;
  date: string;
  notes?: string;
}

interface ExportButtonProps {
  athlete: Athlete;
  sessions: Session[];
  activities?: Activity[];
  type?: 'weekly' | 'profile' | 'plan';
  startDate?: string;
  endDate?: string;
  goalDescription?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  athlete,
  sessions,
  activities = [],
  type = 'weekly',
  startDate,
  endDate,
  goalDescription
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (exportType: 'weekly' | 'profile' | 'plan') => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      switch (exportType) {
        case 'weekly': {
          // Calculate weekly stats
          const totalDistance = activities.reduce((sum, act) => sum + act.distance, 0);
          const totalDuration = activities.reduce((sum, act) => sum + act.duration, 0);
          const stats = {
            totalDistance,
            totalDuration,
            sessionsCompleted: activities.length,
            averagePace: totalDistance > 0 
              ? `${Math.floor(totalDuration / totalDistance / 60)}'${Math.floor((totalDuration / totalDistance) % 60)}"`
              : '0\'00"',
            weekNumber: Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
            dateRange: `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')} - ${new Date().toLocaleDateString('fr-FR')}`
          };
          await exportWeeklyReport(athlete, sessions.slice(0, 7), activities.slice(0, 7), stats);
          break;
        }

        case 'profile': {
          // Calculate total stats
          const totalDistance = activities.reduce((sum, act) => sum + act.distance, 0);
          const totalDuration = activities.reduce((sum, act) => sum + act.duration, 0);
          const totalStats = {
            totalSessions: activities.length,
            totalDistance,
            totalDuration,
            averagePace: totalDistance > 0 
              ? `${Math.floor(totalDuration / totalDistance / 60)}'${Math.floor((totalDuration / totalDistance) % 60)}"`
              : '0\'00"'
          };
          await exportAthleteProfile(athlete, sessions, activities, totalStats);
          break;
        }

        case 'plan': {
          const start = startDate || new Date().toISOString().split('T')[0];
          const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          await exportTrainingPlan(athlete, sessions, start, end, goalDescription);
          break;
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  if (type !== 'weekly') {
    // Single export button
    return (
      <button
        className="export-button"
        onClick={() => handleExport(type)}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <span className="export-icon">⏳</span>
            Génération...
          </>
        ) : (
          <>
            <span className="export-icon">📄</span>
            Exporter PDF
          </>
        )}
      </button>
    );
  }

  // Multiple export options
  return (
    <div className="export-menu-container">
      <button
        className="export-button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <span className="export-icon">⏳</span>
            Génération...
          </>
        ) : (
          <>
            <span className="export-icon">📄</span>
            Exporter PDF
            <span className="export-arrow">{showMenu ? '▲' : '▼'}</span>
          </>
        )}
      </button>

      {showMenu && (
        <div className="export-dropdown">
          <button
            className="export-dropdown-item"
            onClick={() => handleExport('weekly')}
          >
            <span className="export-dropdown-icon">📊</span>
            <div className="export-dropdown-content">
              <div className="export-dropdown-title">Bilan Hebdomadaire</div>
              <div className="export-dropdown-desc">Résumé des 7 derniers jours</div>
            </div>
          </button>

          <button
            className="export-dropdown-item"
            onClick={() => handleExport('profile')}
          >
            <span className="export-dropdown-icon">👤</span>
            <div className="export-dropdown-content">
              <div className="export-dropdown-title">Fiche Athlète</div>
              <div className="export-dropdown-desc">Profil complet avec stats</div>
            </div>
          </button>

          <button
            className="export-dropdown-item"
            onClick={() => handleExport('plan')}
          >
            <span className="export-dropdown-icon">📅</span>
            <div className="export-dropdown-content">
              <div className="export-dropdown-title">Plan d'Entraînement</div>
              <div className="export-dropdown-desc">Programme détaillé</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
