
export interface HeartRateZone {
  zone: number;
  name: string;
  min: number;
  max: number;
  percentage: string;
  description: string;
}

export interface VMAZone {
  zone: number;
  name: string;
  minSpeed: number;
  maxSpeed: number;
  percentage: string;
  description: string;
}

/**
 * Calcule les zones cardiaques basées sur la FC MAX (méthode % FC MAX)
 */
export function calculateHeartRateZones(fcMax: number): HeartRateZone[] {
  return [
    {
      zone: 1,
      name: 'Récupération',
      min: Math.round(fcMax * 0.5),
      max: Math.round(fcMax * 0.6),
      percentage: '50-60%',
      description: 'Récupération active',
    },
    {
      zone: 2,
      name: 'Endurance',
      min: Math.round(fcMax * 0.6),
      max: Math.round(fcMax * 0.7),
      percentage: '60-70%',
      description: 'Endurance fondamentale',
    },
    {
      zone: 3,
      name: 'Tempo',
      min: Math.round(fcMax * 0.7),
      max: Math.round(fcMax * 0.8),
      percentage: '70-80%',
      description: 'Endurance active',
    },
    {
      zone: 4,
      name: 'Seuil',
      min: Math.round(fcMax * 0.8),
      max: Math.round(fcMax * 0.9),
      percentage: '80-90%',
      description: 'Seuil anaérobie',
    },
    {
      zone: 5,
      name: 'Maximum',
      min: Math.round(fcMax * 0.9),
      max: fcMax,
      percentage: '90-100%',
      description: 'Effort maximum',
    },
  ];
}

/**
 * Calcule les zones VMA (vitesse en km/h)
 */
export function calculateVMAZones(vma: number): VMAZone[] {
  return [
    {
      zone: 1,
      name: 'Récupération active',
      minSpeed: 0,
      maxSpeed: Math.round(vma * 0.6 * 100) / 100,
      percentage: '< 60%',
      description: 'Récupération',
    },
    {
      zone: 2,
      name: 'Endurance fondamentale',
      minSpeed: Math.round(vma * 0.6 * 100) / 100,
      maxSpeed: Math.round(vma * 0.75 * 100) / 100,
      percentage: '60-75%',
      description: 'Base aérobie',
    },
    {
      zone: 3,
      name: 'Endurance active',
      minSpeed: Math.round(vma * 0.75 * 100) / 100,
      maxSpeed: Math.round(vma * 0.85 * 100) / 100,
      percentage: '75-85%',
      description: 'Développement aérobie',
    },
    {
      zone: 4,
      name: 'Seuil',
      minSpeed: Math.round(vma * 0.85 * 100) / 100,
      maxSpeed: Math.round(vma * 0.9 * 100) / 100,
      percentage: '85-90%',
      description: 'Seuil anaérobie',
    },
    {
      zone: 5,
      name: 'VMA longue',
      minSpeed: Math.round(vma * 0.9 * 100) / 100,
      maxSpeed: Math.round(vma * 1.0 * 100) / 100,
      percentage: '90-100%',
      description: 'Intervalles longs (3-6 min)',
    },
    {
      zone: 6,
      name: 'VMA courte',
      minSpeed: Math.round(vma * 1.0 * 100) / 100,
      maxSpeed: Math.round(vma * 1.1 * 100) / 100,
      percentage: '100-110%',
      description: 'Intervalles courts (30s-2min)',
    },
  ];
}

/**
 * Détermine dans quelle zone cardiaque se trouve une FC donnée
 */
export function getHeartRateZone(heartRate: number, zones: HeartRateZone[]): number {
  for (const zone of zones) {
    if (heartRate >= zone.min && heartRate <= zone.max) {
      return zone.zone;
    }
  }
  // Si au-dessus de la zone 5, retourne 5
  if (heartRate > zones[zones.length - 1].max) {
    return zones.length;
  }
  // Si en dessous de la zone 1, retourne 1
  return 1;
}

/**
 * Détermine dans quelle zone VMA se trouve une vitesse donnée
 */
export function getVMAZone(speed: number, zones: VMAZone[]): number {
  for (const zone of zones) {
    if (speed >= zone.minSpeed && speed <= zone.maxSpeed) {
      return zone.zone;
    }
  }
  // Si au-dessus de la zone 6, retourne 6
  if (speed > zones[zones.length - 1].maxSpeed) {
    return zones.length;
  }
  // Si en dessous de la zone 1, retourne 1
  return 1;
}

/**
 * Convertit une vitesse en km/h en allure min/km
 */
export function speedToPace(speedKmh: number): string {
  if (speedKmh === 0) return '--:--';
  const minutesPerKm = 60 / speedKmh;
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Convertit une allure min/km en vitesse km/h
 */
export function paceToSpeed(pace: string): number {
  const [minutes, seconds] = pace.split(':').map(Number);
  if (isNaN(minutes) || isNaN(seconds)) return 0;
  const totalMinutes = minutes + seconds / 60;
  return 60 / totalMinutes;
}
