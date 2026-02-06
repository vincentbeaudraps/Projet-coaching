import { useState, useMemo } from 'react';
import type { SessionFilters } from '../components/SessionFilters';

interface Session {
  id: string;
  title: string;
  athleteId?: string;
  type?: string;
  intensity?: string;
  startDate: string;
  duration: number;
  blocks?: string;
  notes?: string;
}

const defaultFilters: SessionFilters = {
  search: '',
  athleteId: '',
  type: '',
  intensity: '',
  dateFrom: '',
  dateTo: '',
  hasZones: '',
  minDuration: '',
  maxDuration: '',
  status: 'all',
};

export function useSessionFilters(sessions: Session[]) {
  const [filters, setFilters] = useState<SessionFilters>(defaultFilters);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Search filter (title and notes)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = session.title?.toLowerCase().includes(searchLower);
        const notesMatch = session.notes?.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !notesMatch) {
          return false;
        }
      }

      // Athlete filter
      if (filters.athleteId && session.athleteId !== filters.athleteId) {
        return false;
      }

      // Type filter
      if (filters.type && session.type !== filters.type) {
        return false;
      }

      // Intensity filter
      if (filters.intensity && session.intensity !== filters.intensity) {
        return false;
      }

      // Date range filter
      const sessionDate = new Date(session.startDate);
      
      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        if (sessionDate < dateFrom) {
          return false;
        }
      }

      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999); // End of day
        if (sessionDate > dateTo) {
          return false;
        }
      }

      // Duration filter
      if (filters.minDuration) {
        const minDuration = parseInt(filters.minDuration);
        if (session.duration < minDuration) {
          return false;
        }
      }

      if (filters.maxDuration) {
        const maxDuration = parseInt(filters.maxDuration);
        if (session.duration > maxDuration) {
          return false;
        }
      }

      // Has zones filter
      if (filters.hasZones) {
        const hasZones = session.blocks ? true : false;
        const wantsZones = filters.hasZones === 'true';
        
        if (hasZones !== wantsZones) {
          return false;
        }
      }

      // Status filter (upcoming/completed)
      if (filters.status !== 'all') {
        const now = new Date();
        const isUpcoming = sessionDate > now;
        
        if (filters.status === 'upcoming' && !isUpcoming) {
          return false;
        }
        if (filters.status === 'completed' && isUpcoming) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, filters]);

  const stats = useMemo(() => {
    return {
      total: sessions.length,
      filtered: filteredSessions.length,
      hidden: sessions.length - filteredSessions.length,
    };
  }, [sessions.length, filteredSessions.length]);

  return {
    filters,
    setFilters,
    filteredSessions,
    stats,
  };
}
