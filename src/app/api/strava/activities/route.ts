import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import prisma from '@/lib/prisma';
import { StravaClient } from '@/lib/strava-client';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling } from '@/lib/api-response';
import { rateLimiter, RateLimits, getClientIdentifier } from '@/lib/rate-limit';
import { headers } from 'next/headers';

export async function GET() {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('GET', '/api/strava/activities');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.warn('Unauthorized access attempt to Strava activities');
      return ErrorResponses.unauthorized();
    }

    // Rate limiting
    const headersList = await headers();
    const identifier = getClientIdentifier(headersList, session.user.id);
    if (!rateLimiter.check(identifier, RateLimits.data)) {
      logger.warn('Rate limit exceeded for Strava activities', { identifier });
      return ErrorResponses.badRequest('Rate limit exceeded. Please try again later.');
    }

    logger.debug('Fetching Strava activities', { userId: session.user.id });

    const stravaClient = new StravaClient(prisma);

    // Get valid access token (with automatic refresh if needed)
    const tokenResult = await stravaClient.getValidAccessToken(session.user.id);

    if (!tokenResult) {
      logger.warn('Strava not connected for user', { userId: session.user.id });
      return ErrorResponses.badRequest('Strava account not connected. Please connect your Strava account.');
    }

    // Fetch activities with full details (200 for full year coverage)
    const detailedActivities = await stravaClient.fetchActivitiesWithDetails(tokenResult.accessToken, 200);

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/strava/activities', 200, duration, {
      activitiesCount: detailedActivities.length
    });

    return successResponse(detailedActivities);
  });
} 