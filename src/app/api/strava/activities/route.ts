import { NextRequest, NextResponse } from "next/server";
import { StravaClient } from "@/lib/strava/client";
import { processActivities } from "@/lib/strava/processActivities";
import { getStravaToken } from "@/lib/auth/session";
import { handleAPIError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/withAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function handler(
  request: NextRequest,
  context: { params: any },
  prisma: any
) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    
    const accessToken = await getStravaToken();
    const stravaClient = new StravaClient(accessToken);
    const activities = await stravaClient.getActivitiesByYear(year);
    
    // Store activities in database with RLS protection
    for (const activity of activities) {
      await prisma.activity.upsert({
        where: {
          id: activity.id.toString(),
        },
        update: {
          name: activity.name,
          type: activity.type,
          distance: activity.distance,
          movingTime: activity.moving_time,
          totalTime: activity.elapsed_time,
          startDate: new Date(activity.start_date),
          timezone: activity.timezone || 'UTC',
        },
        create: {
          id: activity.id.toString(),
          userId: (await getServerSession(authOptions))?.user?.id!,
          name: activity.name,
          type: activity.type,
          distance: activity.distance,
          movingTime: activity.moving_time,
          totalTime: activity.elapsed_time,
          startDate: new Date(activity.start_date),
          timezone: activity.timezone || 'UTC',
        },
      });
    }

    const formattedData = processActivities(activities, year);
    return NextResponse.json(formattedData);
  } catch (error) {
    return handleAPIError(error);
  }
}

export const GET = withAuth(handler); 