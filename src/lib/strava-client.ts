/**
 * Strava API client with token refresh and error handling
 */

import { PrismaClient, Account } from '@prisma/client';
import { logger } from './logger';

interface FetchActivitiesOptions {
  cacheKey?: string;
  ttlMs?: number;
  after?: number;
  timeoutMs?: number;
  retryOn429?: boolean;
}

interface ActivitiesCacheEntry {
  value: unknown[];
  expiresAt: number;
  requestedPerPage: number;
}

const activitiesCache = new Map<string, ActivitiesCacheEntry>();
const activityDetailsCache = new Map<number, { value: unknown; expiresAt: number }>();

export interface StravaTokenRefreshResult {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export class StravaClient {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get a valid Strava access token for a user, refreshing if necessary
   */
  async getValidAccessToken(userId: string): Promise<{ account: Account; accessToken: string } | null> {
    logger.dbQuery('findFirst', 'Account', { userId, provider: 'strava' });

    const stravaAccount = await this.prisma.account.findFirst({
      where: {
        userId,
        provider: 'strava',
      },
    });

    if (!stravaAccount) {
      logger.warn('No Strava account found', { userId });
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    let accessToken = stravaAccount.access_token || '';

    if (!accessToken) {
      logger.error('No access token available', undefined, { userId });
      return null;
    }

    // Check if token needs refresh
    if (stravaAccount.expires_at && stravaAccount.expires_at < now) {
      logger.info('Strava token expired, refreshing', {
        userId,
        expiresAt: stravaAccount.expires_at,
        now
      });

      const refreshResult = await this.refreshAccessToken(stravaAccount);

      if (!refreshResult) {
        logger.error('Failed to refresh Strava token', undefined, { userId });
        return null;
      }

      accessToken = refreshResult.access_token;

      // Update token in database
      logger.dbQuery('update', 'Account', { accountId: stravaAccount.id });
      await this.prisma.account.update({
        where: { id: stravaAccount.id },
        data: {
          access_token: refreshResult.access_token,
          expires_at: refreshResult.expires_at,
          refresh_token: refreshResult.refresh_token,
        },
      });

      logger.info('Strava token refreshed successfully', { userId });
    }

    return { account: stravaAccount, accessToken };
  }

  /**
   * Refresh a Strava access token
   */
  private async refreshAccessToken(account: Account): Promise<StravaTokenRefreshResult | null> {
    if (!account.refresh_token) {
      logger.error('No refresh token available', undefined, { accountId: account.id });
      return null;
    }

    try {
      logger.externalApi('Strava', 'POST /oauth/token (refresh)');

      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Strava token refresh failed', undefined, {
          status: response.status,
          error: errorText
        });
        return null;
      }

      const data = await response.json();

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000 + data.expires_in),
      };
    } catch (error) {
      logger.error('Error refreshing Strava token', error);
      return null;
    }
  }

  /**
   * Fetch activities from Strava API
   */
  async fetchActivities(
    accessToken: string,
    perPage: number = 10,
    options: FetchActivitiesOptions = {}
  ): Promise<unknown[]> {
    const { cacheKey, ttlMs = 5 * 60 * 1000, after, timeoutMs = 12_000 } = options;
    const now = Date.now();

    let cachedEntry: ActivitiesCacheEntry | undefined;
    if (cacheKey) {
      cachedEntry = activitiesCache.get(cacheKey);
      if (cachedEntry && cachedEntry.expiresAt > now && cachedEntry.requestedPerPage >= perPage) {
        logger.debug('Serving cached Strava activities', { cacheKey, perPage });
        return cachedEntry.value;
      }
    }

    const staleValue = cachedEntry && cachedEntry.requestedPerPage >= perPage
      ? cachedEntry.value
      : undefined;

    try {
      const query = new URL('https://www.strava.com/api/v3/athlete/activities');
      query.searchParams.set('per_page', Math.min(200, Math.max(perPage, 1)).toString());
      if (after) {
        query.searchParams.set('after', after.toString());
      }

      logger.externalApi('Strava', `GET /athlete/activities${query.search}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;

      try {
        response = await fetch(query, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default 1 minute
          
          logger.warn('Rate limited on activities fetch, using stale cache if available', {
            retryAfter: waitTime / 1000,
            cacheKey,
          });
          
          if (staleValue) {
            logger.warn('Using stale Strava activities cache due to rate limiting', { cacheKey, perPage });
            return staleValue;
          }
          
          // If no stale cache available, return empty array instead of throwing
          logger.warn('No stale cache available, returning empty activities array due to rate limiting', { cacheKey });
          return [];
        }
        
        const errorText = await response.text();
        logger.error('Strava activities fetch failed', undefined, {
          status: response.status,
          error: errorText
        });
        if (staleValue) {
          logger.warn('Using stale Strava activities cache after API failure', { cacheKey, perPage });
          return staleValue;
        }
        throw new Error(`Strava API error: ${response.status}`);
      }

      const activities = await response.json();
      logger.info(`Fetched ${activities.length} activities from Strava`);

      if (cacheKey) {
        activitiesCache.set(cacheKey, {
          value: activities,
          expiresAt: Date.now() + ttlMs,
          requestedPerPage: perPage,
        });
      }

      return activities;
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        logger.error('Strava activities fetch timed out', undefined, { timeoutMs, cacheKey });
        if (staleValue) {
          logger.warn('Using stale Strava activities cache after timeout', { cacheKey, perPage });
          return staleValue;
        }
      } else {
        logger.error('Error fetching activities from Strava', error);
        if (staleValue) {
          logger.warn('Using stale Strava activities cache after error', { cacheKey, perPage });
          return staleValue;
        }
      }
      throw error;
    }
  }

  /**
   * Fetch detailed activity data including GPS coordinates
   */
  async fetchActivityDetails(accessToken: string, activityId: number, retries = 3): Promise<unknown> {
    // Check cache first (30 min TTL)
    const cached = activityDetailsCache.get(activityId);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      logger.debug('Serving cached activity details', { activityId });
      return cached.value;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.externalApi('Strava', `GET /activities/${activityId}`);

        const response = await fetch(
          `https://www.strava.com/api/v3/activities/${activityId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const details = await response.json();

          // Cache for 30 minutes
          activityDetailsCache.set(activityId, {
            value: details,
            expiresAt: now + 30 * 60 * 1000
          });

          return details;
        } else if (response.status === 429) {
          // Rate limited - wait before retry
          const retryAfter = response.headers.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          
          logger.warn('Rate limited on activity details, waiting before retry', {
            activityId,
            attempt,
            waitTime: waitTime / 1000,
            retryAfter,
          });
          
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            // If no more retries, return null instead of throwing
            logger.warn('Max retries exceeded for activity details due to rate limiting', { activityId });
            return null;
          }
        } else {
          const errorText = await response.text();
          logger.error('Strava activity details fetch failed', undefined, {
            activityId,
            status: response.status,
            error: errorText,
            attempt,
          });
          throw new Error(`Strava API error: ${response.status}`);
        }
      } catch (error) {
        if (attempt === retries) {
          logger.error('Error fetching activity details from Strava', error, { activityId });
          throw error;
        } else {
          logger.warn('Retrying activity details fetch', { activityId, attempt, error });
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
  }

  /**
   * Fetch activities with full details including GPS data
   */
  async fetchActivitiesWithDetails(
    accessToken: string,
    perPage: number = 10,
    options: FetchActivitiesOptions = {}
  ): Promise<unknown[]> {
    const activities = await this.fetchActivities(accessToken, perPage, options) as Array<{ id: number; [key: string]: unknown }>;

    const detailedActivities = await Promise.allSettled(
      activities.map(async (activity) => {
        try {
          const details = await this.fetchActivityDetails(accessToken, activity.id) as Record<string, unknown> | null;
          if (details === null) {
            logger.warn(`Activity details fetch returned null for activity ${activity.id}, using basic data`);
            return activity;
          }
          return {
            ...activity,
            start_latlng: details.start_latlng,
            end_latlng: details.end_latlng,
            map: details.map,
            start_latitude: details.start_latitude,
            start_longitude: details.start_longitude,
            end_latitude: details.end_latitude,
            end_longitude: details.end_longitude,
          };
        } catch (error) {
          logger.warn(`Failed to fetch details for activity ${activity.id}, using basic data`, { error });
          return activity;
        }
      })
    );

    return detailedActivities
      .filter((result) => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<unknown>).value);
  }
}
