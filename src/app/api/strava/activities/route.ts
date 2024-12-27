import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { StravaClient } from "@/lib/strava/client";
import { processActivities } from "@/lib/strava/processActivities";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accessToken) {
      console.error("No access token found in session:", session);
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const stravaClient = new StravaClient(session.user.accessToken);
    const activities = await stravaClient.getActivitiesByYear(year);
    const formattedData = processActivities(activities, year);

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching Strava activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
} 