import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import prisma from '@/lib/prisma';
import { StravaClient } from '@/lib/strava-client';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling } from '@/lib/api-response';
import { rateLimiter, RateLimits, getClientIdentifier } from '@/lib/rate-limit';
import { headers } from 'next/headers';

interface StravaPhoto {
  id: number;
  activity_id: number;
  unique_id: string;
  urls: {
    100: string;
    600: string;
  };
  source: number;
  caption?: string;
  created_at: string;
}

interface StravaActivity {
  id: number;
  name: string;
  photo_count?: number;
}

interface ActivityWithPhotos {
  id: number;
  name: string;
  photos: StravaPhoto[];
}

const photosCache = new Map<string, { data: ActivityWithPhotos[]; expiresAt: number }>();

export async function GET() {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('GET', '/api/strava/photos');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.warn('Unauthorized access attempt to Strava photos');
      return ErrorResponses.unauthorized();
    }

    // Rate limiting
    const headersList = await headers();
    const identifier = getClientIdentifier(headersList, session.user.id);
    if (!rateLimiter.check(identifier, RateLimits.data)) {
      logger.warn('Rate limit exceeded for Strava photos', { identifier });
      return ErrorResponses.badRequest('Rate limit exceeded. Please try again later.');
    }

    const cacheKey = `photos:${session.user.id}`;
    const cached = photosCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      logger.info('Serving cached Strava photos', { userId: session.user.id });
      const duration = Date.now() - startTime;
      logger.apiResponse('GET', '/api/strava/photos', 200, duration, {
        cache: true,
        photoCount: cached.data.reduce((sum, a) => sum + a.photos.length, 0),
      });

      return successResponse(cached.data);
    }

    const stravaClient = new StravaClient(prisma);
    const tokenResult = await stravaClient.getValidAccessToken(session.user.id);

    if (!tokenResult) {
      logger.warn('Strava not connected for user', { userId: session.user.id });
      return ErrorResponses.badRequest('Strava account not connected.');
    }

    // Fetch recent activities (last 20 to reduce API calls)
    const activities = await stravaClient.fetchActivities(tokenResult.accessToken, 20, {
      cacheKey: `activities:${session.user.id}:photos`,
      ttlMs: 10 * 60 * 1000, // 10 minutes
    }) as StravaActivity[];

    logger.info('Fetched activities for photos', {
      activityCount: activities.length,
      activitiesWithPhotoCount: activities.filter(a => a.photo_count && a.photo_count > 0).length
    });

    const activitiesWithPhotos: ActivityWithPhotos[] = [];

    // Fetch photos for all recent activities (not just those with photo_count)
    // because photo_count might not be reliable in the list response
    let checkedCount = 0;
    let foundCount = 0;

    for (const activity of activities.slice(0, 15)) { // Check first 15 activities
      checkedCount++;
      try {
        const photoResponse = await fetch(
          `https://www.strava.com/api/v3/activities/${activity.id}/photos?size=600&photo_sources=true`,
          {
            headers: {
              Authorization: `Bearer ${tokenResult.accessToken}`,
            },
          }
        );

        if (photoResponse.ok) {
          const photos: StravaPhoto[] = await photoResponse.json();
          if (photos.length > 0) {
            foundCount++;
            logger.info('Found photos for activity', {
              activityId: activity.id,
              activityName: activity.name,
              photoCount: photos.length,
              photoUrls: photos.map(p => p.urls[600]),
            });
            activitiesWithPhotos.push({
              id: activity.id,
              name: activity.name,
              photos,
            });
          } else {
            logger.info('No photos for activity', {
              activityId: activity.id,
              activityName: activity.name,
            });
          }
        } else {
          const errorText = await photoResponse.text();
          logger.warn('Photo fetch failed', {
            activityId: activity.id,
            activityName: activity.name,
            status: photoResponse.status,
            error: errorText,
          });
        }
      } catch (error) {
        logger.warn('Failed to fetch photos for activity', {
          activityId: activity.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Photo fetch summary', {
      totalActivities: activities.length,
      checkedActivities: checkedCount,
      activitiesWithPhotos: foundCount,
      totalPhotos: activitiesWithPhotos.reduce((sum, a) => sum + a.photos.length, 0),
    });

    photosCache.set(cacheKey, {
      data: activitiesWithPhotos,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/strava/photos', 200, duration, {
      activitiesWithPhotos: activitiesWithPhotos.length,
      totalPhotos: activitiesWithPhotos.reduce((sum, a) => sum + a.photos.length, 0),
    });

    return successResponse(activitiesWithPhotos);
  });
}
