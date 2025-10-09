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

    // Fetch recent activities (last 30 to reduce API calls)
    let activities: StravaActivity[] = [];
    try {
      activities = await stravaClient.fetchActivities(tokenResult.accessToken, 30, {
        cacheKey: `activities:${session.user.id}:photos`,
        ttlMs: 15 * 60 * 1000, // 15 minutes cache
      }) as StravaActivity[];

      logger.info('Fetched activities for photos', {
        activityCount: activities.length,
        activitiesWithPhotoCount: activities.filter(a => a.photo_count && a.photo_count > 0).length
      });
    } catch (error) {
      logger.warn('Failed to fetch activities for photos, returning empty result', {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id
      });
      
      // Return empty result instead of failing completely
      const duration = Date.now() - startTime;
      logger.apiResponse('GET', '/api/strava/photos', 200, duration, {
        cache: false,
        photoCount: 0,
        error: 'activities_fetch_failed'
      });

      return successResponse([]);
    }

    const activitiesWithPhotos: ActivityWithPhotos[] = [];

    // Fetch photos for activities with rate limiting and retry logic
    let checkedCount = 0;
    let foundCount = 0;
    let rateLimited = false;

    // Helper function to add delay between requests
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper function to fetch photos with retry logic
    const fetchPhotosWithRetry = async (activity: StravaActivity, retries = 3): Promise<StravaPhoto[] | null> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          // Add delay between requests to respect rate limits
          if (checkedCount > 0) {
            await delay(200); // 200ms delay between requests
          }

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
            return photos;
          } else if (photoResponse.status === 429) {
            // Rate limited - wait longer before retry
            const retryAfter = photoResponse.headers.get('retry-after');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
            
            logger.warn('Rate limited, waiting before retry', {
              activityId: activity.id,
              attempt,
              waitTime: waitTime / 1000,
              retryAfter,
            });
            
            if (attempt < retries) {
              await delay(waitTime);
              continue;
            } else {
              rateLimited = true;
              return null;
            }
          } else {
            const errorText = await photoResponse.text();
            logger.warn('Photo fetch failed', {
              activityId: activity.id,
              activityName: activity.name,
              status: photoResponse.status,
              error: errorText,
              attempt,
            });
            return null;
          }
        } catch (error) {
          logger.warn('Failed to fetch photos for activity', {
            activityId: activity.id,
            error: error instanceof Error ? error.message : String(error),
            attempt,
          });
          
          if (attempt < retries) {
            await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          }
        }
      }
      return null;
    };

    // Process activities in smaller batches to avoid overwhelming the API
    const activitiesToCheck = activities.slice(0, 15); // Reduced from 20 to 15
    const batchSize = 5; // Process 5 activities at a time
    
    for (let i = 0; i < activitiesToCheck.length; i += batchSize) {
      const batch = activitiesToCheck.slice(i, i + batchSize);
      
      // Process batch sequentially to avoid rate limits
      for (const activity of batch) {
        if (rateLimited) {
          logger.warn('Stopping photo fetch due to rate limiting', {
            checkedCount,
            foundCount,
            remainingActivities: activitiesToCheck.length - checkedCount,
          });
          break;
        }

        checkedCount++;
        const photos = await fetchPhotosWithRetry(activity);
        
        if (photos && photos.length > 0) {
          foundCount++;
          logger.info('Found photos for activity', {
            activityId: activity.id,
            activityName: activity.name,
            photoCount: photos.length,
          });
          activitiesWithPhotos.push({
            id: activity.id,
            name: activity.name,
            photos,
          });
        } else if (photos !== null) {
          logger.info('No photos for activity', {
            activityId: activity.id,
            activityName: activity.name,
          });
        }
      }

      // Add delay between batches
      if (i + batchSize < activitiesToCheck.length && !rateLimited) {
        await delay(1000); // 1 second delay between batches
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
    const summary = {
      activitiesWithPhotos: activitiesWithPhotos.length,
      totalPhotos: activitiesWithPhotos.reduce((sum, a) => sum + a.photos.length, 0),
      checkedActivities: checkedCount,
      totalActivities: activities.length,
    };

    logger.apiResponse('GET', '/api/strava/photos', 200, duration, summary);

    return successResponse(activitiesWithPhotos);
  });
}
