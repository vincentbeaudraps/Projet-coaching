import { TrainingSession } from '../types/index';

interface CalendarProps {
  sessions: TrainingSession[];
}

function Calendar({ sessions }: CalendarProps) {
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
                      {daysSessions.map((session) => (
                        <div key={session.id} className="session-dot" title={session.title}>
                          •
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
