import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import prisma from '@/lib/prisma';
import { StravaClient } from '@/lib/strava-client';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling } from '@/lib/api-response';

export async function GET() {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('GET', '/api/strava/activities');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.warn('Unauthorized access attempt to Strava activities');
      return ErrorResponses.unauthorized();
    }

    logger.debug('Fetching Strava activities', { userId: session.user.id });

    const stravaClient = new StravaClient(prisma);

    // Get valid access token (with automatic refresh if needed)
    const tokenResult = await stravaClient.getValidAccessToken(session.user.id);

    if (!tokenResult) {
      logger.warn('Strava not connected for user', { userId: session.user.id });
      return ErrorResponses.badRequest('Strava account not connected. Please connect your Strava account.');
    }

    // Fetch activities with full details
    const detailedActivities = await stravaClient.fetchActivitiesWithDetails(tokenResult.accessToken, 10);

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/strava/activities', 200, duration, {
      activitiesCount: detailedActivities.length
    });

    return successResponse(detailedActivities);
  });
} 