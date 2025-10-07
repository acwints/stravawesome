/**
 * Strava API client with token refresh and error handling
 */

import { PrismaClient, Account } from '@prisma/client';
import { logger } from './logger';

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
  async fetchActivities(accessToken: string, perPage: number = 10): Promise<unknown[]> {
    try {
      logger.externalApi('Strava', `GET /athlete/activities?per_page=${perPage}`);

      const response = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&include_all_efforts=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Strava activities fetch failed', undefined, {
          status: response.status,
          error: errorText
        });
        throw new Error(`Strava API error: ${response.status}`);
      }

      const activities = await response.json();
      logger.info(`Fetched ${activities.length} activities from Strava`);

      return activities;
    } catch (error) {
      logger.error('Error fetching activities from Strava', error);
      throw error;
    }
  }

  /**
   * Fetch detailed activity data including GPS coordinates
   */
  async fetchActivityDetails(accessToken: string, activityId: number): Promise<unknown> {
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

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Strava activity details fetch failed', undefined, {
          activityId,
          status: response.status,
          error: errorText
        });
        throw new Error(`Strava API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error fetching activity details from Strava', error, { activityId });
      throw error;
    }
  }

  /**
   * Fetch activities with full details including GPS data
   */
  async fetchActivitiesWithDetails(accessToken: string, perPage: number = 10): Promise<unknown[]> {
    const activities = await this.fetchActivities(accessToken, perPage) as Array<{ id: number; [key: string]: unknown }>;

    const detailedActivities = await Promise.allSettled(
      activities.map(async (activity) => {
        try {
          const details = await this.fetchActivityDetails(accessToken, activity.id) as Record<string, unknown>;
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
