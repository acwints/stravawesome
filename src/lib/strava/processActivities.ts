import { StravaActivity } from '@/types/strava';
import { getMonday, formatDate, convertToMiles, processIndoorRide } from './client';

interface WeeklyData {
  running: Record<string, number>;
  walking: Record<string, number>;
  cycling: Record<string, number>;
  indoor: Record<string, number>;
  dates: Record<string, Date>;
}

interface FormattedData {
  labels: string[];
  datasets: {
    running: Array<{
      week: string;
      running: number;
      walking: number;
      total: number;
    }>;
    cycling: Array<{
      week: string;
      cycling: number;
      indoor: number;
    }>;
  };
}

export function processActivities(activities: StravaActivity[], year: number): FormattedData {
  // Process activities into weekly data
  const weeklyData = activities.reduce<WeeklyData>((acc, activity) => {
    const date = new Date(activity.start_date);
    const monday = getMonday(date);
    const weekKey = formatDate(monday);
    
    switch (activity.type) {
      case "Run":
        acc.running[weekKey] = (acc.running[weekKey] || 0) + convertToMiles(activity.distance);
        break;
      case "Walk":
      case "Hike":
        acc.walking[weekKey] = (acc.walking[weekKey] || 0) + convertToMiles(activity.distance);
        break;
      case "Ride":
        if ('trainer' in activity && activity.trainer) {
          processIndoorRide(activity, weekKey, acc);
        } else if (activity.distance) {
          acc.cycling[weekKey] = (acc.cycling[weekKey] || 0) + convertToMiles(activity.distance);
        }
        break;
    }

    // Store the full date for sorting
    if (!acc.dates[weekKey]) {
      acc.dates[weekKey] = monday;
    }
    
    return acc;
  }, { running: {}, walking: {}, cycling: {}, indoor: {}, dates: {} });

  // Get all weeks in the year
  const allWeeks: string[] = [];
  const currentDate = new Date(year, 0, 1);
  while (currentDate.getFullYear() === year) {
    const monday = getMonday(currentDate);
    allWeeks.push(formatDate(monday));
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return {
    labels: allWeeks,
    datasets: {
      running: allWeeks.map(week => {
        const running = Math.round(weeklyData.running[week] || 0);
        const walking = Math.round(weeklyData.walking[week] || 0);
        return {
          week,
          running,
          walking,
          total: running + walking
        };
      }),
      cycling: allWeeks.map(week => ({
        week,
        cycling: Math.round(weeklyData.cycling[week] || 0),
        indoor: Math.round(weeklyData.indoor[week] || 0),
      })),
    },
  };
} 