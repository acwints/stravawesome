/**
 * Type definitions for Strava API responses
 */

export interface StravaActivitySummary {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  average_speed?: number;
  total_elevation_gain?: number;
  average_heartrate?: number;
  max_heartrate?: number;
}

export interface ActivityForAI {
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  average_speed?: number;
  total_elevation_gain?: number;
  average_heartrate?: number;
  max_heartrate?: number;
}
