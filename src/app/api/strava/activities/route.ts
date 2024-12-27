import { NextResponse } from "next/server";
import { StravaClient } from "@/lib/strava/client";
import { processActivities } from "@/lib/strava/processActivities";
import { getStravaToken } from "@/lib/auth/session";
import { handleAPIError } from "@/lib/api/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    
    const accessToken = await getStravaToken();
    const stravaClient = new StravaClient(accessToken);
    const activities = await stravaClient.getActivitiesByYear(year);
    const formattedData = processActivities(activities, year);

    return NextResponse.json(formattedData);
  } catch (error) {
    return handleAPIError(error);
  }
} 