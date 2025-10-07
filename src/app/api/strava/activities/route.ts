import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the user's Strava token
    const stravaAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'strava',
      },
    });

    if (!stravaAccount) {
      return NextResponse.json({ error: 'Strava not connected' }, { status: 400 });
    }

    // Check if token needs refresh
    const now = Math.floor(Date.now() / 1000);
    let accessToken = stravaAccount.access_token;

    if (stravaAccount.expires_at && stravaAccount.expires_at < now) {
      // Token needs refresh
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: stravaAccount.refresh_token,
        }),
      });

      const data = await response.json();
      accessToken = data.access_token;

      // Update token in database
      await prisma.account.update({
        where: { id: stravaAccount.id },
        data: {
          access_token: data.access_token,
          expires_at: Math.floor(Date.now() / 1000 + data.expires_in),
          refresh_token: data.refresh_token,
        },
      });
    }

    // Fetch activities from Strava with detailed data including GPS coordinates
    const activitiesResponse = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=10&include_all_efforts=true',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const activities = await activitiesResponse.json();
    
    // Fetch detailed data for each activity to get GPS coordinates
    const detailedActivities = await Promise.all(
      activities.map(async (activity: any) => {
        try {
          const detailResponse = await fetch(
            `https://www.strava.com/api/v3/activities/${activity.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const detailData = await detailResponse.json();
          return {
            ...activity,
            start_latlng: detailData.start_latlng,
            end_latlng: detailData.end_latlng,
            map: detailData.map,
            start_latitude: detailData.start_latitude,
            start_longitude: detailData.start_longitude,
            end_latitude: detailData.end_latitude,
            end_longitude: detailData.end_longitude,
          };
        } catch (error) {
          console.error(`Error fetching details for activity ${activity.id}:`, error);
          return activity;
        }
      })
    );

    return NextResponse.json(detailedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
} 