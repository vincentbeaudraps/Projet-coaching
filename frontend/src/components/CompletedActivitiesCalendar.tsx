import { CompletedActivity, Athlete } from '../types/index';
import { useState } from 'react';
import ActivityModal from './ActivityModal';
import { activitiesService } from '../services/api';

interface CompletedActivitiesCalendarProps {
  activities: CompletedActivity[];
  athletes?: Athlete[];
  onActivityUpdated?: () => void;
}

function CompletedActivitiesCalendar({ activities, athletes, onActivityUpdated }: CompletedActivitiesCalendarProps) {
  const [selectedActivity, setSelectedActivity] = useState<CompletedActivity | null>(null);
  const [showModal, setShowModal] = useState(false);
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

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const getActivitiesForDay = (day: number) => {
    return activities.filter((activity) => {
      const activityDate = new Date(activity.start_date);
      return (
        activityDate.getDate() === day &&
        activityDate.getMonth() === currentMonth &&
        activityDate.getFullYear() === currentYear
      );
    });
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const getAthleteById = (athleteId: string) => {
    return athletes?.find((a) => a.id === athleteId);
  };

  // Fonction pour déterminer la zone cardio basée sur l'activité réalisée
  const getActivityZone = (activity: CompletedActivity): number => {
    // Si on a la fréquence cardiaque moyenne, on peut calculer la zone
    if (activity.avg_heart_rate) {
      const athlete = getAthleteById(activity.athlete_id);
      const fcMax = (athlete as any)?.max_heart_rate || 190; // Valeur par défaut si non disponible
      
      const hrPercentage = (activity.avg_heart_rate / fcMax) * 100;
      
      if (hrPercentage < 60) return 1; // Récupération
      if (hrPercentage < 70) return 2; // Endurance
      if (hrPercentage < 80) return 3; // Tempo
      if (hrPercentage < 90) return 4; // Seuil
      return 5; // Maximum
    }

    // Sinon, on estime basé sur le type d'activité et la vitesse
    const type = activity.activity_type.toLowerCase();
    
    // Pour les courses
    if (type.includes('run') || type.includes('course')) {
      if (activity.distance && activity.duration) {
        const speedKmh = (activity.distance / (activity.duration / 60));
        // Estimation approximative basée sur la vitesse
        if (speedKmh < 8) return 2; // Endurance
        if (speedKmh < 12) return 3; // Tempo
        if (speedKmh < 15) return 4; // Seuil
        return 5; // Maximum
      }
    }
    
    // Types d'activités par défaut
    if (type.includes('walk') || type.includes('march')) return 1; // Récupération
    if (type.includes('yoga') || type.includes('stretch')) return 1; // Récupération
    
    return 2; // Zone 2 par défaut (endurance)
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

  const getActivityIcon = (activityType: string) => {
    const type = activityType.toLowerCase();
    if (type.includes('run') || type.includes('course')) return '🏃';
    if (type.includes('bike') || type.includes('cycl') || type.includes('vélo')) return '🚴';
    if (type.includes('swim') || type.includes('nata')) return '🏊';
    if (type.includes('walk') || type.includes('march')) return '🚶';
    if (type.includes('hike') || type.includes('rando')) return '🥾';
    if (type.includes('gym') || type.includes('musc')) return '🏋️';
    return '💪';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${mins}min`;
  };

  return (
    <div className="calendar-view completed-activities-calendar">
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
        <span className="calendar-badge completed-badge">✅ Réalisé</span>
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
            const daysActivities = day ? getActivitiesForDay(day) : [];
            return (
              <div key={idx} className={`calendar-cell ${day ? '' : 'empty'}`}>
                {day && (
                  <>
                    <div className="day-number">{day}</div>
                    <div className="day-sessions">
                      {daysActivities.map((activity) => {
                        const athlete = getAthleteById(activity.athlete_id);
                        const zone = getActivityZone(activity);
                        const zoneColor = getZoneColor(zone);
                        
                        return (
                          <div
                            key={activity.id}
                            className="session-badge activity-badge"
                            style={{ 
                              borderLeftColor: zoneColor,
                              background: `linear-gradient(135deg, ${zoneColor}15 0%, ${zoneColor}05 100%)`
                            }}
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowModal(true);
                            }}
                            title={`${activity.title} - Zone ${zone} (${getZoneName(zone)}) - ${athlete?.name || (athlete as any)?.user_name || 'Athlète'}`}
                          >
                            <div className="session-zone-badge" style={{ backgroundColor: zoneColor }}>
                              Z{zone}
                            </div>
                            <div className="session-content">
                              <span className="activity-icon">
                                {getActivityIcon(activity.activity_type)}
                              </span>
                              <span className="activity-info">
                                {activity.distance ? `${Number(activity.distance).toFixed(1)}km` : formatDuration(activity.duration)}
                              </span>
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

      {/* Nouveau Modal avec fonctionnalités d'édition */}
      {showModal && selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          onClose={() => {
            setShowModal(false);
            setSelectedActivity(null);
          }}
          onSave={async (updatedData) => {
            await activitiesService.update(selectedActivity.id, updatedData);
            if (onActivityUpdated) {
              onActivityUpdated();
            }
            setShowModal(false);
            setSelectedActivity(null);
          }}
          onDelete={async () => {
            await activitiesService.delete(selectedActivity.id);
            if (onActivityUpdated) {
              onActivityUpdated();
            }
            setShowModal(false);
            setSelectedActivity(null);
          }}
        />
      )}
    </div>
  );
}

export default CompletedActivitiesCalendar;
