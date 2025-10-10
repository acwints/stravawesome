import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import prisma from '@/lib/prisma';
import { StravaClient, StravaAuthError } from '@/lib/strava-client';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling } from '@/lib/api-response';
import { rateLimiter, RateLimits, getClientIdentifier } from '@/lib/rate-limit';
import { sharedDataService } from '@/lib/shared-data-service';
import { StravaActivity } from '@/types';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

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

    let tokenResult;
    try {
      tokenResult = await stravaClient.getValidAccessToken(session.user.id);
    } catch (error) {
      if (error instanceof StravaAuthError) {
        if (error.code === 'STRAVA_REAUTH_REQUIRED') {
          logger.warn('Strava connection expired for user', { userId: session.user.id });
          return NextResponse.json(
            {
              success: false,
              error: 'Strava connection expired. Please reconnect your Strava account.',
              code: error.code,
            },
            { status: 401 }
          );
        }

        if (error.code === 'STRAVA_NOT_CONNECTED') {
          logger.warn('Strava not connected for user', { userId: session.user.id });
          return NextResponse.json(
            {
              success: false,
              error: 'Strava account not connected. Please connect your Strava account.',
              code: error.code,
            },
            { status: 400 }
          );
        }
      }
      throw error;
    }

    // Fetch most recent activities with full details (capped to 25 to stay within runtime limits)
    // Strava allows 100 requests per 15 minutes, 1000 per day
    // Using aggressive caching to minimize repeated requests
    const cacheKey = `activities:${session.user.id}:detailed`;
    let detailedActivities: StravaActivity[];

    try {
      detailedActivities = await stravaClient.fetchActivitiesWithDetails(
        tokenResult.accessToken,
        25,
        {
          cacheKey,
          ttlMs: 15 * 60 * 1000, // 15 minutes cache
        }
      ) as StravaActivity[];
    } catch (error) {
      if (error instanceof StravaAuthError) {
        logger.warn('Strava access revoked by user', { userId: session.user.id });
        await stravaClient.disconnectUserAccount(session.user.id);
        return NextResponse.json(
          {
            success: false,
            error: 'Strava connection expired. Please reconnect your Strava account.',
            code: 'STRAVA_REAUTH_REQUIRED',
          },
          { status: 401 }
        );
      }
      throw error;
    }

    // If no activities found, this might be a new user or rate limiting
    if (!detailedActivities || detailedActivities.length === 0) {
      logger.warn('No activities found for user', { 
        userId: session.user.id,
        cacheKey 
      });
    }

    // Cache in shared service
    sharedDataService.setActivities(session.user.id, detailedActivities as StravaActivity[]);

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/strava/activities', 200, duration, {
      activitiesCount: detailedActivities.length,
      cache: 'fresh'
    });

    return successResponse(detailedActivities);
  });
} 
