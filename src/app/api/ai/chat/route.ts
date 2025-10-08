import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import prisma from '@/lib/prisma';
import { StravaClient } from '@/lib/strava-client';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling, validateEnvVars } from '@/lib/api-response';
import { rateLimiter, RateLimits, getClientIdentifier } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { sanitizeString } from '@/lib/validation';
import OpenAI from 'openai';

validateEnvVars(['OPENAI_API_KEY']);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('POST', '/api/ai/chat');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.warn('Unauthorized access attempt to AI chat');
      return ErrorResponses.unauthorized();
    }

    // Rate limiting for expensive AI operations
    const headersList = await headers();
    const identifier = getClientIdentifier(headersList, session.user.id);
    if (!rateLimiter.check(identifier, RateLimits.ai)) {
      logger.warn('Rate limit exceeded for AI chat', { identifier });
      return ErrorResponses.badRequest('Rate limit exceeded. Please wait before sending another message.');
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      logger.warn('Invalid message in AI chat request', { userId: session.user.id });
      return ErrorResponses.badRequest('Message is required and must be a string');
    }

    // Sanitize and validate input
    const sanitizedMessage = sanitizeString(message.substring(0, 500)); // Limit length
    if (sanitizedMessage.length === 0) {
      return ErrorResponses.badRequest('Message cannot be empty');
    }

    logger.debug('Processing AI chat request', { userId: session.user.id, messageLength: sanitizedMessage.length });

    const stravaClient = new StravaClient(prisma);

    // Get valid access token (with automatic refresh if needed)
    const tokenResult = await stravaClient.getValidAccessToken(session.user.id);

    if (!tokenResult) {
      logger.warn('Strava not connected for AI chat', { userId: session.user.id });
      return ErrorResponses.badRequest('Strava account not connected. Please connect your Strava account first.');
    }

    // Fetch recent activities from Strava (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const unixTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);

    logger.externalApi('Strava', `GET /athlete/activities (after=${unixTimestamp})`);

    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${unixTimestamp}&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
      }
    );

    if (!activitiesResponse.ok) {
      logger.error('Failed to fetch activities for AI chat', undefined, {
        status: activitiesResponse.status
      });
      return ErrorResponses.internalError('Failed to fetch activities from Strava');
    }

    const activities = await activitiesResponse.json();
    logger.info(`Fetched ${activities.length} activities for AI chat`, { userId: session.user.id });

    // Get user's goals
    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        year: new Date().getFullYear(),
      },
    });

    // Prepare training data summary for AI
    interface StravaActivity {
      name: string;
      type: string;
      distance: number;
      moving_time: number;
      start_date: string;
      average_speed?: number;
      total_elevation_gain?: number;
      average_heartrate?: number;
      max_heartrate?: number;
    }

    const trainingData = {
      activities: activities.map((activity: StravaActivity) => ({
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
        totalDistance: activities.reduce((sum: number, activity: StravaActivity) => sum + activity.distance, 0),
        totalTime: activities.reduce((sum: number, activity: StravaActivity) => sum + (activity.moving_time || 0), 0),
        activityTypes: [...new Set(activities.map((activity: StravaActivity) => activity.type))],
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
${activities.slice(0, 10).map((activity: StravaActivity) =>
  `- ${activity.name} (${activity.type}): ${(activity.distance / 1609.34).toFixed(2)} miles on ${new Date(activity.start_date).toLocaleDateString()}`
).join('\n')}

Please provide helpful, encouraging, and insightful analysis based on this training data. Be specific about patterns, progress, and suggestions for improvement.`;

    logger.debug('Calling OpenAI API', { model: 'gpt-4', messageLength: message.length });

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

    const duration = Date.now() - startTime;
    logger.apiResponse('POST', '/api/ai/chat', 200, duration, {
      userId: session.user.id,
      activitiesCount: activities.length,
      responseLength: aiResponse.length
    });

    return successResponse({
      response: aiResponse,
      trainingData: {
        totalActivities: trainingData.summary.totalActivities,
        totalDistance: (trainingData.summary.totalDistance / 1609.34).toFixed(2),
        totalTime: Math.round(trainingData.summary.totalTime / 3600),
        activityTypes: trainingData.summary.activityTypes,
      }
    });
  });
}