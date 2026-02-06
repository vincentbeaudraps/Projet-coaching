import { useState } from 'react';
import '../styles/SessionFilters.css';

export interface SessionFilters {
  search: string;
  athleteId: string;
  type: string;
  intensity: string;
  dateFrom: string;
  dateTo: string;
  hasZones: string;
  minDuration: string;
  maxDuration: string;
  status: string; // 'upcoming', 'completed', 'all'
}

interface SessionFiltersProps {
  filters: SessionFilters;
  onFiltersChange: (filters: SessionFilters) => void;
  athletes?: Array<{ id: string; name: string }>;
  showAthleteFilter?: boolean;
}

export default function SessionFilters({
  filters,
  onFiltersChange,
  athletes = [],
  showAthleteFilter = true,
}: SessionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof SessionFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({
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
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all').length;

  return (
    <div className="session-filters">
      {/* Quick Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher par titre ou notes..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="search-input"
          />
          {filters.search && (
            <button
              className="clear-search"
              onClick={() => handleChange('search', '')}
              title="Effacer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="quick-filters">
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">Toutes les séances</option>
            <option value="upcoming">À venir</option>
            <option value="completed">Complétées</option>
          </select>

          {showAthleteFilter && athletes.length > 0 && (
            <select
              value={filters.athleteId}
              onChange={(e) => handleChange('athleteId', e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les athlètes</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          )}

          <button
            className={`toggle-filters-btn ${isExpanded ? 'active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="icon">⚙️</span>
            Filtres avancés
            {activeFiltersCount > 0 && (
              <span className="filter-badge">{activeFiltersCount}</span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button className="reset-filters-btn" onClick={handleReset}>
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="advanced-filters-panel">
          <div className="filters-grid">
            {/* Type Filter */}
            <div className="filter-group">
              <label className="filter-label">Type de séance</label>
              <select
                value={filters.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="filter-input"
              >
                <option value="">Tous les types</option>
                <option value="run">🏃 Course</option>
                <option value="trail">⛰️ Trail</option>
                <option value="recovery">🧘 Récupération</option>
                <option value="interval">⚡ Fractionné</option>
                <option value="tempo">🎯 Tempo</option>
                <option value="endurance">💪 Endurance</option>
                <option value="race">🏁 Compétition</option>
              </select>
            </div>

            {/* Intensity Filter */}
            <div className="filter-group">
              <label className="filter-label">Intensité</label>
              <select
                value={filters.intensity}
                onChange={(e) => handleChange('intensity', e.target.value)}
                className="filter-input"
              >
                <option value="">Toutes les intensités</option>
                <option value="recovery">😌 Récupération</option>
                <option value="easy">😊 Facile</option>
                <option value="moderate">🙂 Modérée</option>
                <option value="threshold">😤 Seuil</option>
                <option value="tempo">💪 Tempo</option>
                <option value="vo2max">🔥 VO2 Max</option>
                <option value="sprint">⚡ Sprint</option>
              </select>
            </div>

            {/* Date From */}
            <div className="filter-group">
              <label className="filter-label">Date de début</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Date To */}
            <div className="filter-group">
              <label className="filter-label">Date de fin</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Duration Min */}
            <div className="filter-group">
              <label className="filter-label">Durée minimum (min)</label>
              <input
                type="number"
                placeholder="Ex: 30"
                value={filters.minDuration}
                onChange={(e) => handleChange('minDuration', e.target.value)}
                className="filter-input"
                min="0"
                max="300"
              />
            </div>

            {/* Duration Max */}
            <div className="filter-group">
              <label className="filter-label">Durée maximum (min)</label>
              <input
                type="number"
                placeholder="Ex: 120"
                value={filters.maxDuration}
                onChange={(e) => handleChange('maxDuration', e.target.value)}
                className="filter-input"
                min="0"
                max="300"
              />
            </div>

            {/* Has Zones */}
            <div className="filter-group">
              <label className="filter-label">Zones cardio</label>
              <select
                value={filters.hasZones}
                onChange={(e) => handleChange('hasZones', e.target.value)}
                className="filter-input"
              >
                <option value="">Peu importe</option>
                <option value="true">Avec zones</option>
                <option value="false">Sans zones</option>
              </select>
            </div>
          </div>

          <div className="filters-actions">
            <button className="btn-apply-filters" onClick={() => setIsExpanded(false)}>
              ✓ Appliquer les filtres
            </button>
            <button className="btn-cancel-filters" onClick={handleReset}>
              Réinitialiser tout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
