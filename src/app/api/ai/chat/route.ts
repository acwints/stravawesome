import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

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

    // Fetch recent activities from Strava (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const unixTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);

    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${unixTimestamp}&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const activities = await activitiesResponse.json();

    // Get user's goals
    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        year: new Date().getFullYear(),
      },
    });

    // Prepare training data summary for AI
    const trainingData = {
      activities: activities.map((activity: any) => ({
        name: activity.name,
        type: activity.type,
        distance: activity.distance,
        moving_time: activity.moving_time,
        start_date: activity.start_date,
        average_speed: activity.average_speed,
        total_elevation_gain: activity.total_elevation_gain,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
      })),
      goals: goals.map(goal => ({
        activityType: goal.activityType,
        targetDistance: goal.targetDistance,
        year: goal.year,
      })),
      summary: {
        totalActivities: activities.length,
        totalDistance: activities.reduce((sum: number, activity: any) => sum + activity.distance, 0),
        totalTime: activities.reduce((sum: number, activity: any) => sum + (activity.moving_time || 0), 0),
        activityTypes: [...new Set(activities.map((activity: any) => activity.type))],
      }
    };

    // Create AI prompt
    const systemPrompt = `You are a helpful AI assistant that analyzes Strava training data. You have access to the user's recent activities and goals. 

Training Data Summary:
- Total Activities (last 30 days): ${trainingData.summary.totalActivities}
- Total Distance: ${(trainingData.summary.totalDistance / 1609.34).toFixed(2)} miles
- Total Time: ${Math.round(trainingData.summary.totalTime / 3600)} hours
- Activity Types: ${trainingData.summary.activityTypes.join(', ')}

Goals for ${new Date().getFullYear()}:
${goals.map(goal => `- ${goal.activityType}: ${goal.targetDistance} miles`).join('\n')}

Recent Activities (last 10):
${activities.slice(0, 10).map((activity: any) => 
  `- ${activity.name} (${activity.type}): ${(activity.distance / 1609.34).toFixed(2)} miles on ${new Date(activity.start_date).toLocaleDateString()}`
).join('\n')}

Please provide helpful, encouraging, and insightful analysis based on this training data. Be specific about patterns, progress, and suggestions for improvement.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ 
      response: aiResponse,
      trainingData: {
        totalActivities: trainingData.summary.totalActivities,
        totalDistance: (trainingData.summary.totalDistance / 1609.34).toFixed(2),
        totalTime: Math.round(trainingData.summary.totalTime / 3600),
        activityTypes: trainingData.summary.activityTypes,
      }
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}