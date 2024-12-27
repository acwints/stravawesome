import { StravaActivity } from '@/types/strava';

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const METERS_TO_MILES = 0.000621371;
const CALORIES_PER_MILE = 45;
const INDOOR_MILES_PER_HOUR = 15;

export class StravaClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getActivitiesByYear(year: number): Promise<StravaActivity[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    return this.fetch<StravaActivity[]>(
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
  return meters * METERS_TO_MILES;
}

export function processIndoorRide(activity: any, weekKey: string, acc: any): void {
  let miles = 0;
  
  if (activity.distance) {
    miles = convertToMiles(activity.distance);
  } else if (activity.calories) {
    miles = activity.calories / CALORIES_PER_MILE;
  } else if (activity.moving_time) {
    miles = (activity.moving_time / 3600) * INDOOR_MILES_PER_HOUR;
  }
  
  acc.indoor[weekKey] = (acc.indoor[weekKey] || 0) + miles;
} 