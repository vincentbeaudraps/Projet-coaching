import { TrainingSession, Athlete } from '../types/index';
import { useState } from 'react';
import { sessionsService } from '../services/api';

interface CalendarProps {
  sessions: TrainingSession[];
  athletes?: Athlete[];
}

function Calendar({ sessions, athletes }: CalendarProps) {
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [exporting, setExporting] = useState(false);
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
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

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'low':
      case 'faible':
        return '#4CAF50';
      case 'moderate':
      case 'modéré':
        return '#FF9800';
      case 'high':
      case 'élevé':
        return '#f44336';
      default:
        return '#2196F3';
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

      alert(`Séance exportée avec succès au format ${format.toUpperCase()} !`);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Erreur lors de l'export`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="calendar-view">
      <h2>{monthName}</h2>
      <div className="calendar-grid">
        <div className="calendar-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
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
                        return (
                          <div
                            key={session.id}
                            className="session-badge"
                            style={{ borderLeftColor: getIntensityColor(session.intensity) }}
                            onClick={() => setSelectedSession(session)}
                            title={`${session.title} - ${(() => {
                              const athleteName = athlete?.first_name && athlete?.last_name
                                ? `${athlete.first_name} ${athlete.last_name}`
                                : (athlete as any)?.user_name || athlete?.name || 'Athlète';
                              return athleteName;
                            })()}`}
                          >
                            <span className="session-time">
                              {new Date(session.start_date).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="session-title-short">{session.title}</span>
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
                    backgroundColor: getIntensityColor(selectedSession.intensity),
                  }}
                >
                  {selectedSession.intensity}
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
