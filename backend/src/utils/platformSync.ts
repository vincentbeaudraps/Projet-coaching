import axios from 'axios';
import { PLATFORM_CONFIGS, Platform, ACTIVITY_TYPE_MAPPING } from '../config/platforms.js';
import { exportToTCX } from './workoutExporter.js';

interface WorkoutData {
  title: string;
  description: string;
  type: string;
  duration: number;
  distance?: number;
  intensity: string;
  blocks?: any[];
}

interface PlatformConnection {
  id: string;
  platform: Platform;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: Date;
}

// Push workout to Garmin Connect
export async function pushToGarmin(workout: WorkoutData, connection: PlatformConnection): Promise<any> {
  const config = PLATFORM_CONFIGS.garmin;
  
  // Convert workout to Garmin format
  const garminWorkout = {
    workoutName: workout.title,
    description: workout.description,
    sport: ACTIVITY_TYPE_MAPPING.garmin[workout.type as keyof typeof ACTIVITY_TYPE_MAPPING.garmin] || 'RUNNING',
    workoutSegments: workout.blocks?.map((block: any, index: number) => ({
      segmentOrder: index + 1,
      sportType: ACTIVITY_TYPE_MAPPING.garmin[workout.type as keyof typeof ACTIVITY_TYPE_MAPPING.garmin] || 'RUNNING',
      durationType: block.durationType || 'TIME',
      durationValue: block.duration || 60,
      targetType: block.targetType || 'NO_TARGET',
      targetValueLow: block.targetLow,
      targetValueHigh: block.targetHigh,
    })) || [],
  };

  const response = await axios.post(
    `${config.workoutApiUrl}/workout`,
    garminWorkout,
    {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Push workout to Strava
export async function pushToStrava(workout: WorkoutData, connection: PlatformConnection): Promise<any> {
  const config = PLATFORM_CONFIGS.strava;
  
  // Strava doesn't have a direct workout push API
  // We can create a planned activity instead
  const stravaActivity = {
    name: workout.title,
    description: workout.description,
    type: ACTIVITY_TYPE_MAPPING.strava[workout.type as keyof typeof ACTIVITY_TYPE_MAPPING.strava] || 'Run',
    distance: workout.distance,
    elapsed_time: workout.duration,
    trainer: false,
    commute: false,
  };

  const response = await axios.post(
    `${config.apiBaseUrl}/activities`,
    stravaActivity,
    {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Push workout to Suunto
export async function pushToSuunto(workout: WorkoutData, connection: PlatformConnection): Promise<any> {
  const config = PLATFORM_CONFIGS.suunto;
  
  const suuntoWorkout = {
    name: workout.title,
    description: workout.description,
    sport: ACTIVITY_TYPE_MAPPING.suunto[workout.type as keyof typeof ACTIVITY_TYPE_MAPPING.suunto] || 'Running',
    duration: workout.duration,
    distance: workout.distance,
    steps: workout.blocks?.map((block: any) => ({
      type: block.type || 'interval',
      duration: block.duration,
      intensity: block.intensity,
    })) || [],
  };

  const response = await axios.post(
    `${config.apiBaseUrl}/workouts`,
    suuntoWorkout,
    {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Push workout to COROS
export async function pushToCoros(workout: WorkoutData, connection: PlatformConnection): Promise<any> {
  const config = PLATFORM_CONFIGS.coros;
  
  const corosWorkout = {
    name: workout.title,
    description: workout.description,
    sport_type: ACTIVITY_TYPE_MAPPING.coros[workout.type as keyof typeof ACTIVITY_TYPE_MAPPING.coros] || 'Run',
    duration: workout.duration,
    distance: workout.distance,
    intervals: workout.blocks?.map((block: any) => ({
      duration: block.duration,
      target_pace: block.targetPace,
      target_hr: block.targetHR,
      repeat: block.repeat || 1,
    })) || [],
  };

  const response = await axios.post(
    `${config.apiBaseUrl}/training/workouts`,
    corosWorkout,
    {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Push workout to Polar Flow
export async function pushToPolar(workout: WorkoutData, connection: PlatformConnection): Promise<any> {
  const config = PLATFORM_CONFIGS.polar;
  
  const polarWorkout = {
    name: workout.title,
    description: workout.description,
    sport: ACTIVITY_TYPE_MAPPING.polar[workout.type as keyof typeof ACTIVITY_TYPE_MAPPING.polar] || 'RUNNING',
    duration: workout.duration,
    distance: workout.distance,
    phases: workout.blocks?.map((block: any, index: number) => ({
      index: index + 1,
      duration: { type: 'TIME', value: block.duration },
      intensity: block.intensity || 'LIGHT',
      target: block.targetHR ? {
        type: 'HEART_RATE',
        value_low: block.targetHR.min,
        value_high: block.targetHR.max,
      } : undefined,
    })) || [],
  };

  const response = await axios.post(
    `${config.apiBaseUrl}/exercises`,
    polarWorkout,
    {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Push workout to Decathlon Coach
export async function pushToDecathlon(workout: WorkoutData, connection: PlatformConnection): Promise<any> {
  const config = PLATFORM_CONFIGS.decathlon;
  
  const decathlonWorkout = {
    title: workout.title,
    description: workout.description,
    sport: ACTIVITY_TYPE_MAPPING.decathlon[workout.type as keyof typeof ACTIVITY_TYPE_MAPPING.decathlon] || 'running',
    duration: workout.duration,
    distance: workout.distance,
    intensity: workout.intensity,
    steps: workout.blocks?.map((block: any) => ({
      duration: block.duration,
      distance: block.distance,
      pace: block.targetPace,
      heartRate: block.targetHR,
    })) || [],
  };

  const response = await axios.post(
    `${config.apiBaseUrl}/workouts`,
    decathlonWorkout,
    {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Main function to push workout to any platform
export async function pushWorkoutToPlatform(
  workout: WorkoutData,
  platform: Platform,
  connection: PlatformConnection
): Promise<any> {
  switch (platform) {
    case 'garmin':
      return await pushToGarmin(workout, connection);
    case 'strava':
      return await pushToStrava(workout, connection);
    case 'suunto':
      return await pushToSuunto(workout, connection);
    case 'coros':
      return await pushToCoros(workout, connection);
    case 'polar':
      return await pushToPolar(workout, connection);
    case 'decathlon':
      return await pushToDecathlon(workout, connection);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Fetch activities from platform
export async function fetchActivitiesFromPlatform(
  platform: Platform,
  connection: PlatformConnection,
  since?: Date
): Promise<any[]> {
  const config = PLATFORM_CONFIGS[platform];
  const params: any = {};

  if (since) {
    params.after = Math.floor(since.getTime() / 1000);
  }

  try {
    let response;
    
    switch (platform) {
      case 'strava':
        response = await axios.get(`${config.apiBaseUrl}/athlete/activities`, {
          headers: { Authorization: `Bearer ${connection.access_token}` },
          params,
        });
        return response.data;

      case 'garmin':
        response = await axios.get(`${config.apiBaseUrl}/activities`, {
          headers: { Authorization: `Bearer ${connection.access_token}` },
          params,
        });
        return response.data;

      case 'suunto':
        response = await axios.get(`${config.apiBaseUrl}/workouts`, {
          headers: { Authorization: `Bearer ${connection.access_token}` },
          params,
        });
        return response.data;

      case 'coros':
        response = await axios.get(`${config.apiBaseUrl}/activity/list`, {
          headers: { Authorization: `Bearer ${connection.access_token}` },
          params,
        });
        return response.data;

      case 'polar':
        response = await axios.get(`${config.apiBaseUrl}/users/exercises`, {
          headers: { Authorization: `Bearer ${connection.access_token}` },
          params,
        });
        return response.data;

      case 'decathlon':
        response = await axios.get(`${config.apiBaseUrl}/activities`, {
          headers: { Authorization: `Bearer ${connection.access_token}` },
          params,
        });
        return response.data;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error: any) {
    console.error(`Failed to fetch activities from ${platform}:`, error.response?.data || error.message);
    throw error;
  }
}
