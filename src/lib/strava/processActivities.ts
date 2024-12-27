import { StravaActivity } from '@/types/strava';
import { getMonday, formatDate, convertToMiles, processIndoorRide } from './client';
import { STRAVA_CONSTANTS } from './client';

interface WeeklyData {
  running: Record<string, number>;
  walking: Record<string, number>;
  cycling: Record<string, number>;
  indoor: Record<string, number>;
  dates: Record<string, Date>;
}

interface ActivityDataset {
  week: string;
  running: number;
  walking: number;
  total: number;
}

interface CyclingDataset {
  week: string;
  cycling: number;
  indoor: number;
}

interface FormattedData {
  labels: string[];
  datasets: {
    running: ActivityDataset[];
    cycling: CyclingDataset[];
  };
}

function initializeWeeklyData(): WeeklyData {
  return {
    running: {},
    walking: {},
    cycling: {},
    indoor: {},
    dates: {},
  };
}

function processActivity(acc: WeeklyData, activity: StravaActivity, weekKey: string): void {
  const { ACTIVITY_TYPES } = STRAVA_CONSTANTS;

  switch (activity.type) {
    case ACTIVITY_TYPES.RUN:
      acc.running[weekKey] = (acc.running[weekKey] || 0) + convertToMiles(activity.distance);
      break;
    case ACTIVITY_TYPES.WALK:
    case ACTIVITY_TYPES.HIKE:
      acc.walking[weekKey] = (acc.walking[weekKey] || 0) + convertToMiles(activity.distance);
      break;
    case ACTIVITY_TYPES.RIDE:
      if ('trainer' in activity && activity.trainer) {
        processIndoorRide(activity, weekKey, acc);
      } else if (activity.distance) {
        acc.cycling[weekKey] = (acc.cycling[weekKey] || 0) + convertToMiles(activity.distance);
      }
      break;
  }
}

function generateWeeks(year: number): string[] {
  const weeks: string[] = [];
  const currentDate = new Date(year, 0, 1);
  
  while (currentDate.getFullYear() === year) {
    weeks.push(formatDate(getMonday(currentDate)));
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return weeks;
}

function formatDatasets(weeklyData: WeeklyData, allWeeks: string[]): FormattedData['datasets'] {
  return {
    running: allWeeks.map(week => ({
      week,
      running: Math.round(weeklyData.running[week] || 0),
      walking: Math.round(weeklyData.walking[week] || 0),
      total: Math.round((weeklyData.running[week] || 0) + (weeklyData.walking[week] || 0))
    })),
    cycling: allWeeks.map(week => ({
      week,
      cycling: Math.round(weeklyData.cycling[week] || 0),
      indoor: Math.round(weeklyData.indoor[week] || 0),
    })),
  };
}

export function processActivities(activities: StravaActivity[], year: number): FormattedData {
  const weeklyData = activities.reduce<WeeklyData>((acc, activity) => {
    const date = new Date(activity.start_date);
    const monday = getMonday(date);
    const weekKey = formatDate(monday);
    
    processActivity(acc, activity, weekKey);
    
    if (!acc.dates[weekKey]) {
      acc.dates[weekKey] = monday;
    }
    
    return acc;
  }, initializeWeeklyData());

  const allWeeks = generateWeeks(year);

  return {
    labels: allWeeks,
    datasets: formatDatasets(weeklyData, allWeeks),
  };
} 