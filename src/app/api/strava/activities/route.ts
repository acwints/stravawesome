import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import prisma from '@/lib/prisma';
import { StravaClient } from '@/lib/strava-client';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling } from '@/lib/api-response';
import { rateLimiter, RateLimits, getClientIdentifier } from '@/lib/rate-limit';
import { sharedDataService } from '@/lib/shared-data-service';
import { StravaActivity } from '@/types';
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

    // Check shared cache first to prevent duplicate calls
    const cachedActivities = sharedDataService.getActivities(session.user.id);
    if (cachedActivities) {
      const duration = Date.now() - startTime;
      logger.apiResponse('GET', '/api/strava/activities', 200, duration, {
        activitiesCount: cachedActivities.length,
        cache: 'shared'
      });
      return successResponse(cachedActivities);
    }

    // Check if another request is already in progress
    if (!sharedDataService.shouldFetch(session.user.id)) {
      logger.debug('Another fetch in progress, waiting...', { userId: session.user.id });
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 1000));
      const retryCached = sharedDataService.getActivities(session.user.id);
      if (retryCached) {
        const duration = Date.now() - startTime;
        logger.apiResponse('GET', '/api/strava/activities', 200, duration, {
          activitiesCount: retryCached.length,
          cache: 'shared_retry'
        });
        return successResponse(retryCached);
      }
    }

    // Mark fetch in progress
    sharedDataService.markFetchInProgress(session.user.id);

    const stravaClient = new StravaClient(prisma);

    // Get valid access token (with automatic refresh if needed)
    const tokenResult = await stravaClient.getValidAccessToken(session.user.id);

    if (!tokenResult) {
      logger.warn('Strava not connected for user', { userId: session.user.id });
      return ErrorResponses.badRequest('Strava account not connected. Please connect your Strava account.');
    }

    // Fetch activities with full details (100 for better coverage)
    // Strava allows 100 requests per 15 minutes, 1000 per day
    // Using aggressive caching to minimize repeated requests
    const cacheKey = `activities:${session.user.id}:detailed`;
    const detailedActivities = await stravaClient.fetchActivitiesWithDetails(
      tokenResult.accessToken, 
      100,
      { 
        cacheKey,
        ttlMs: 15 * 60 * 1000 // 15 minutes cache
      }
    );

    // Cache in shared service
    sharedDataService.setActivities(session.user.id, detailedActivities as StravaActivity[]);

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/strava/activities', 200, duration, {
      activitiesCount: detailedActivities.length
    });

    return successResponse(detailedActivities);
  });
} 