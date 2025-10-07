export interface StravaActivity {
  id: number;
  type: string;
  start_date: string;
  distance: number;
  name?: string;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  average_speed?: number;
  max_speed?: number;
  has_heartrate?: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  map?: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
}

export interface ActivityData {
  week: string;
  fullDate: string;
  running: number;
  cycling: number;
}

export interface Goal {
  id?: string;
  activityType: string;
  targetDistance: number;
  year: number;
  userId: string;
}

export interface ActivityProgress {
  type: string;
  distance: number;
}

export type ActivityType = 'Run' | 'Ride' | 'Walk' | 'Hike';

export interface ActivityTypeConfig {
  type: ActivityType;
  label: string;
  stravaType: string;
  color: string;
}

export interface AIChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface AIChatResponse {
  response: string;
  trainingData: {
    totalActivities: number;
    totalDistance: string;
    totalTime: number;
    activityTypes: string[];
  };
} 