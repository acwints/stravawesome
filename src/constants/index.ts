import { ActivityTypeConfig } from '@/types';

export const METERS_TO_MILES = 0.000621371;
export const METERS_TO_FEET = 3.28084;

export const CURRENT_YEAR = 2025;

export const COLORS = {
  PRIMARY: '#fc4c02',    // Strava orange
  SECONDARY: '#87CEEB',  // Light blue
  SUCCESS: '#22c55e',    // Green
  ERROR: '#ef4444',      // Red
  WARNING: '#f59e0b',    // Yellow
} as const;

export const ACTIVITY_TYPES: ActivityTypeConfig[] = [
  { type: 'Run', label: 'Running', stravaType: 'Run', color: COLORS.PRIMARY },
  { type: 'Ride', label: 'Biking', stravaType: 'Ride', color: COLORS.SECONDARY },
  { type: 'Walk', label: 'Walking', stravaType: 'Walk', color: COLORS.WARNING },
  { type: 'Hike', label: 'Hiking', stravaType: 'Hike', color: COLORS.SUCCESS },
] as const;

export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
} as const; 