import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const METERS_TO_MILES = 0.000621371;
const CALORIES_PER_MILE = 45;
const INDOOR_MILES_PER_HOUR = 15;

// Types
interface StravaActivity {
  type: string;
  distance: number;
  start_date: string;
  calories?: number;
  trainer?: boolean;
  name?: string;
  moving_time?: number;
}

interface WeeklyActivityData {
  running: Record<string, number>;
  walking: Record<string, number>;
  cycling: Record<string, number>;
  indoor: Record<string, number>;
  dates: Record<string, Date>;
}

// Date helper functions
function getMonday(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Activity processing helpers
function convertToMiles(meters: number): number {
  return meters * METERS_TO_MILES;
}

function caloriesToMiles(calories: number): number {
  return calories / CALORIES_PER_MILE;
}

function processIndoorRide(activity: StravaActivity, weekKey: string, acc: WeeklyActivityData): void {
  let miles = 0;
  
  if (activity.distance) {
    miles = convertToMiles(activity.distance);
  } else if (activity.calories) {
    miles = caloriesToMiles(activity.calories);
  } else if (activity.moving_time) {
    miles = (activity.moving_time / 3600) * INDOOR_MILES_PER_HOUR;
  }
  
  acc.indoor[weekKey] = (acc.indoor[weekKey] || 0) + miles;
}

function processActivity(activity: StravaActivity, date: Date, acc: WeeklyActivityData): void {
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
      if (activity.trainer) {
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
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Calculate start and end dates for the requested year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    // Fetch activities from Strava
    const response = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?per_page=200`,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.statusText}`);
    }

    const activities: StravaActivity[] = await response.json();

    // Process activities into weekly data
    const weeklyData = activities.reduce<WeeklyActivityData>(
      (acc, activity) => {
        const date = new Date(activity.start_date);
        
        if (date >= startDate && date < endDate) {
          processActivity(activity, date, acc);
        }
        
        return acc;
      },
      { running: {}, walking: {}, cycling: {}, indoor: {}, dates: {} }
    );

    // Get all weeks in the year
    const allWeeks: string[] = [];
    const currentDate = new Date(year, 0, 1);
    while (currentDate.getFullYear() === year) {
      const monday = getMonday(currentDate);
      allWeeks.push(formatDate(monday));
      currentDate.setDate(currentDate.getDate() + 7);
    }

    const formattedData = {
      labels: allWeeks,
      datasets: {
        running: allWeeks.map(week => ({
          week,
          running: Math.round(weeklyData.running[week] || 0),
          walking: Math.round(weeklyData.walking[week] || 0),
        })),
        cycling: allWeeks.map(week => ({
          week,
          cycling: Math.round(weeklyData.cycling[week] || 0),
          indoor: Math.round(weeklyData.indoor[week] || 0),
        })),
      },
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching Strava activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
} 