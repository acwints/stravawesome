import { StravaActivity } from '@/types/strava';
import { StravaAPIError, AuthError } from '@/lib/api/errors';

export const STRAVA_CONSTANTS = {
  API_BASE: "https://www.strava.com/api/v3",
  CONVERSION: {
    METERS_TO_MILES: 0.000621371,
    CALORIES_PER_MILE: 45,
    INDOOR_MILES_PER_HOUR: 15,
  },
  ACTIVITY_TYPES: {
    RUN: 'Run',
    WALK: 'Walk',
    HIKE: 'Hike',
    RIDE: 'Ride',
  } as const,
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
  },
} as const;

export class StravaClient {
  constructor(private readonly accessToken: string) {}

  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    try {
      const response = await fetch(`${STRAVA_CONSTANTS.API_BASE}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        
        if (response.status === 401) {
          throw new AuthError('Session expired. Please sign in again.');
        }

        throw new StravaAPIError(error.message || 'Strava API request failed');
      }

      return response.json();
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      if (
        attempt < STRAVA_CONSTANTS.RETRY.MAX_ATTEMPTS &&
        error instanceof StravaAPIError
      ) {
        // Wait before retrying
        await new Promise(resolve => 
          setTimeout(resolve, STRAVA_CONSTANTS.RETRY.DELAY_MS * attempt)
        );
        return this.fetchWithRetry<T>(endpoint, options, attempt + 1);
      }

      if (error instanceof StravaAPIError) {
        throw error;
      }

      throw new StravaAPIError(
        error instanceof Error ? error.message : 'Failed to fetch from Strava API'
      );
    }
  }

  async getActivitiesByYear(year: number): Promise<StravaActivity[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    return this.fetchWithRetry<StravaActivity[]>(
      `/athlete/activities?per_page=200&after=${Math.floor(startDate.getTime() / 1000)}&before=${Math.floor(endDate.getTime() / 1000)}`
    );
  }
}

export function getMonday(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function convertToMiles(meters: number): number {
  return meters * STRAVA_CONSTANTS.CONVERSION.METERS_TO_MILES;
}

export function processIndoorRide(activity: any, weekKey: string, acc: any): void {
  let miles = 0;
  
  if (activity.distance) {
    miles = convertToMiles(activity.distance);
  } else if (activity.calories) {
    miles = activity.calories / STRAVA_CONSTANTS.CONVERSION.CALORIES_PER_MILE;
  } else if (activity.moving_time) {
    miles = (activity.moving_time / 3600) * STRAVA_CONSTANTS.CONVERSION.INDOOR_MILES_PER_HOUR;
  }
  
  acc.indoor[weekKey] = (acc.indoor[weekKey] || 0) + miles;
} 