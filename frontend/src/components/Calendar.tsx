import { TrainingSession, Athlete } from '../types/index';
import { useState } from 'react';
import { sessionsService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { showSuccess, showError, showConfirm } from '../utils/toast.tsx';

interface CalendarProps {
  sessions: TrainingSession[];
  athletes?: Athlete[];
  setSessions?: (sessions: TrainingSession[]) => void;
}

function Calendar({ sessions, athletes, setSessions }: CalendarProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [exporting, setExporting] = useState(false);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // getDay() retourne 0 pour dimanche, 1 pour lundi, etc.
    // On ajuste pour que lundi soit 0, mardi 1, etc.
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Si dimanche (0), retourne 6, sinon décale de -1
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const days = [];

  // Empty cells for days before the month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const getSessionsForDay = (day: number) => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.start_date);
      return (
        sessionDate.getDate() === day &&
        sessionDate.getMonth() === currentMonth &&
        sessionDate.getFullYear() === currentYear
      );
    });
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('default', {
    month: 'long',
    year: 'numeric',
  });

  const getAthleteById = (athleteId: string) => {
    return athletes?.find((a) => a.id === athleteId);
  };

  // Fonction pour déterminer la zone cardio dominante basée sur les blocs de la séance
  const getSessionZoneFromBlocks = (session: TrainingSession): number => {
    if (!session.blocks) return 2; // Zone 2 par défaut (endurance)

    try {
      const blocks = JSON.parse(session.blocks);
      
      // Analyse des types de blocs pour déterminer la zone
      let hasIntervals = false;
      let hasThreshold = false;
      let hasTempo = false;
      let totalDuration = 0;
      let highIntensityDuration = 0;

      blocks.forEach((block: any) => {
        const type = block.type?.toLowerCase() || '';
        const duration = block.duration || 0;
        totalDuration += duration;

        if (type.includes('intervalle') || type.includes('interval') || type.includes('répétitions')) {
          hasIntervals = true;
          highIntensityDuration += duration;
        } else if (type.includes('seuil') || type.includes('threshold')) {
          hasThreshold = true;
          highIntensityDuration += duration;
        } else if (type.includes('tempo')) {
          hasTempo = true;
        }
      });

      // Détermination de la zone basée sur l'analyse
      if (hasIntervals) return 5; // Zone 5 - Intervalle/Maximum
      if (hasThreshold) return 4; // Zone 4 - Seuil
      if (hasTempo) return 3; // Zone 3 - Tempo
      if (highIntensityDuration / totalDuration > 0.5) return 4; // Plus de 50% haute intensité
      
      // Analyse basée sur l'intensité de la séance
      const intensity = session.intensity?.toLowerCase() || '';
      if (intensity.includes('élevé') || intensity.includes('high')) return 4;
      if (intensity.includes('modéré') || intensity.includes('moderate')) return 3;
      if (intensity.includes('faible') || intensity.includes('low')) return 2;

      return 2; // Zone 2 par défaut (endurance fondamentale)
    } catch {
      return 2;
    }
  };

  // Couleurs basées sur les zones cardio (alignées avec TrainingZones.css)
  const getZoneColor = (zone: number): string => {
    switch (zone) {
      case 1: return '#48bb78'; // Vert - Récupération
      case 2: return '#4299e1'; // Bleu - Endurance
      case 3: return '#ed8936'; // Orange - Tempo
      case 4: return '#f56565'; // Rouge - Seuil
      case 5: return '#9f7aea'; // Violet - Maximum
      default: return '#4299e1';
    }
  };

  const getZoneName = (zone: number): string => {
    switch (zone) {
      case 1: return 'Récupération';
      case 2: return 'Endurance';
      case 3: return 'Tempo';
      case 4: return 'Seuil';
      case 5: return 'Maximum';
      default: return 'Endurance';
    }
  };

  const handleExport = async (format: 'tcx' | 'json' | 'txt' | 'md') => {
    if (!selectedSession) return;

    setExporting(true);
    try {
      const response = await sessionsService.exportToWatch(selectedSession.id, format);
      
      // Create download link
      let blob: Blob;
      let filename: string;

      if (format === 'json') {
        blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        filename = `${selectedSession.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      } else {
        blob = response.data;
        const extension = format === 'md' ? 'md' : format;
        filename = `${selectedSession.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`Séance exportée au format ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      showError('Erreur lors de l\'export', error as Error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header-row">
        <div className="calendar-navigation">
          <button 
            className="nav-btn" 
            onClick={() => navigateMonth('prev')}
            title="Mois précédent"
          >
            ←
          </button>
          <h2>{monthName}</h2>
          <button 
            className="nav-btn" 
            onClick={() => navigateMonth('next')}
            title="Mois suivant"
          >
            →
          </button>
          <button 
            className="today-btn" 
            onClick={goToToday}
            title="Aujourd'hui"
          >
            Aujourd'hui
          </button>
        </div>
        <span className="calendar-badge planned-badge">📋 Planifié</span>
      </div>
      
      <div className="calendar-grid">
        <div className="calendar-header">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="calendar-day-header">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-body">
          {days.map((day, idx) => {
            const daysSessions = day ? getSessionsForDay(day) : [];
            return (
              <div key={idx} className={`calendar-cell ${day ? '' : 'empty'}`}>
                {day && (
                  <>
                    <div className="day-number">{day}</div>
                    <div className="day-sessions">
                      {daysSessions.map((session) => {
                        const athlete = getAthleteById(session.athlete_id);
                        const zone = getSessionZoneFromBlocks(session);
                        const zoneColor = getZoneColor(zone);
                        
                        return (
                          <div
                            key={session.id}
                            className="session-badge"
                            style={{ 
                              borderLeftColor: zoneColor,
                              background: `linear-gradient(135deg, ${zoneColor}15 0%, ${zoneColor}05 100%)`
                            }}
                            onClick={() => setSelectedSession(session)}
                            title={`${session.title} - Zone ${zone} (${getZoneName(zone)}) - ${(() => {
                              const athleteName = athlete?.first_name && athlete?.last_name
                                ? `${athlete.first_name} ${athlete.last_name}`
                                : (athlete as any)?.user_name || athlete?.name || 'Athlète';
                              return athleteName;
                            })()}`}
                          >
                            <div className="session-zone-badge" style={{ backgroundColor: zoneColor }}>
                              Z{zone}
                            </div>
                            <div className="session-content">
                              <span className="session-time">
                                {new Date(session.start_date).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="session-title-short">{session.title}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de détails de la séance */}
      {selectedSession && (
        <div className="session-modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="session-modal" onClick={(e) => e.stopPropagation()}>
            <div className="session-modal-header">
              <h3>{selectedSession.title}</h3>
              <button className="close-btn" onClick={() => setSelectedSession(null)}>
                ✕
              </button>
            </div>
            <div className="session-modal-body">
              <div className="session-detail">
                <strong>📅 Date :</strong>
                <span>
                  {new Date(selectedSession.start_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {athletes && (
                <div className="session-detail">
                  <strong>🏃 Athlète :</strong>
                  <span>
                    {(() => {
                      const athlete = getAthleteById(selectedSession.athlete_id);
                      if (!athlete) return 'Inconnu';
                      if (athlete.first_name && athlete.last_name) {
                        return `${athlete.first_name} ${athlete.last_name}`;
                      }
                      return (athlete as any).user_name || athlete.name || 'Inconnu';
                    })()}
                  </span>
                </div>
              )}
              <div className="session-detail">
                <strong>🎯 Type :</strong>
                <span>{selectedSession.type}</span>
              </div>
              <div className="session-detail">
                <strong>⚡ Intensité :</strong>
                <span
                  className="intensity-badge"
                  style={{
                    backgroundColor: getZoneColor(getSessionZoneFromBlocks(selectedSession)),
                  }}
                >
                  Zone {getSessionZoneFromBlocks(selectedSession)} - {getZoneName(getSessionZoneFromBlocks(selectedSession))}
                </span>
              </div>
              <div className="session-detail">
                <strong>⏱️ Durée :</strong>
                <span>{selectedSession.duration} minutes</span>
              </div>
              {selectedSession.distance && (
                <div className="session-detail">
                  <strong>📏 Distance :</strong>
                  <span>{selectedSession.distance} km</span>
                </div>
              )}
              {selectedSession.description && (
                <div className="session-detail">
                  <strong>📝 Description :</strong>
                  <p>{selectedSession.description}</p>
                </div>
              )}
              {selectedSession.blocks && (
                <div className="session-detail">
                  <strong>🧩 Blocs d'entraînement :</strong>
                  <div className="blocks-list">
                    {(() => {
                      try {
                        const blocks = JSON.parse(selectedSession.blocks);
                        return blocks.map((block: any, idx: number) => (
                          <div key={idx} className="block-item">
                            <span className="block-number">Bloc {idx + 1}</span>
                            <span className="block-type">{block.type}</span>
                            <span className="block-duration">{block.duration} min</span>
                            <span className="block-pace">
                              {block.pace || block.speed || 'N/A'}
                            </span>
                          </div>
                        ));
                      } catch {
                        return <p>Blocs non disponibles</p>;
                      }
                    })()}
                  </div>
                </div>
              )}
              {selectedSession.notes && (
                <div className="session-detail">
                  <strong>💭 Notes :</strong>
                  <p>{selectedSession.notes}</p>
                </div>
              )}

              {/* Action buttons */}
              {user?.role === 'coach' && (
                <div className="session-actions">
                  <button
                    className="btn-edit-session"
                    onClick={() => {
                      navigate(`/session-builder/${selectedSession.id}`);
                    }}
                  >
                    ✏️ Modifier la séance
                  </button>
                  <button
                    className="btn-delete-session"
                    onClick={() => {
                      showConfirm(
                        'Voulez-vous vraiment supprimer cette séance ?',
                        async () => {
                          try {
                            await sessionsService.delete(selectedSession.id);
                            if (setSessions) {
                              setSessions(sessions.filter(s => s.id !== selectedSession.id));
                            }
                            setSelectedSession(null);
                            showSuccess('Séance supprimée avec succès');
                          } catch (error) {
                            console.error('Erreur suppression séance:', error);
                            showError('Erreur lors de la suppression', error as Error);
                          }
                        },
                        { confirmText: 'Supprimer', dangerous: true }
                      );
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              )}

              {/* Export buttons */}
              <div className="export-section">
                <strong>📤 Envoyer sur montre :</strong>
                <div className="export-buttons">
                  <button
                    className="export-btn export-btn-garmin"
                    onClick={() => handleExport('tcx')}
                    disabled={exporting}
                    title="Compatible: Garmin, Polar, Suunto, Wahoo"
                  >
                    📱 TCX (Garmin/Polar)
                  </button>
                  <button
                    className="export-btn export-btn-coros"
                    onClick={() => handleExport('json')}
                    disabled={exporting}
                    title="Format JSON pour Garmin Connect"
                  >
                    🔗 JSON (Garmin API)
                  </button>
                  <button
                    className="export-btn export-btn-text"
                    onClick={() => handleExport('txt')}
                    disabled={exporting}
                    title="Format texte pour saisie manuelle"
                  >
                    📄 Texte (manuel)
                  </button>
                  <button
                    className="export-btn export-btn-md"
                    onClick={() => handleExport('md')}
                    disabled={exporting}
                    title="Format Markdown pour documentation"
                  >
                    📝 Markdown
                  </button>
                </div>
                {exporting && <p className="export-loading">⏳ Export en cours...</p>}
                <div className="export-help">
                  <p>
                    💡 <strong>Comment utiliser:</strong><br/>
                    • <strong>TCX:</strong> Importez dans Garmin Connect, Polar Flow, Suunto App<br/>
                    • <strong>JSON:</strong> Format API Garmin (avancé)<br/>
                    • <strong>Texte:</strong> Copiez/collez pour saisie manuelle sur votre montre<br/>
                    • <strong>Markdown:</strong> Pour documentation ou partage
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
