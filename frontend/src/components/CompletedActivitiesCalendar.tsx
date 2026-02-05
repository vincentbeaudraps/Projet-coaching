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

  const getActivityTypeColor = (activityType: string) => {
    const type = activityType.toLowerCase();
    if (type.includes('run') || type.includes('course')) return '#FF6B6B';
    if (type.includes('bike') || type.includes('cycl') || type.includes('vélo')) return '#4ECDC4';
    if (type.includes('swim') || type.includes('nata')) return '#45B7D1';
    if (type.includes('walk') || type.includes('march')) return '#96CEB4';
    if (type.includes('hike') || type.includes('rando')) return '#DDA15E';
    return '#95A5A6';
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
        <h2>{monthName}</h2>
        <span className="calendar-badge completed-badge">✅ Réalisé</span>
      </div>
      
      <div className="calendar-grid">
        <div className="calendar-header">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
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
                        return (
                          <div
                            key={activity.id}
                            className="session-badge activity-badge"
                            style={{ borderLeftColor: getActivityTypeColor(activity.activity_type) }}
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowModal(true);
                            }}
                            title={`${activity.title} - ${athlete?.name || (athlete as any)?.user_name || 'Athlète'}`}
                          >
                            <span className="activity-icon">
                              {getActivityIcon(activity.activity_type)}
                            </span>
                            <span className="activity-info">
                              {activity.distance ? `${Number(activity.distance).toFixed(1)}km` : formatDuration(activity.duration)}
                            </span>
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
