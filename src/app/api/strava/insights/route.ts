import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import prisma from '@/lib/prisma';
import { StravaClient } from '@/lib/strava-client';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling } from '@/lib/api-response';
import { rateLimiter, RateLimits, getClientIdentifier } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, subDays } from 'date-fns';

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  suffer_score?: number;
}

interface WeeklySummary {
  totalActivities: number;
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
  lastWeekDistance: number;
  lastWeekActivities: number;
}

interface InsightsPayload {
  weeklySummary: WeeklySummary;
  insights: {
    consistency: {
      daysActive: number;
      totalDays: number;
      percentage: number;
      trend: 'good' | 'fair' | 'low';
    };
    performance: {
      averagePace: number;
      totalRuns: number;
      longestActivity: {
        name: string;
        distance: number;
        type: string;
        date: string;
      } | null;
      weekOverWeekImprovement: number;
    };
    goals: {
      thisMonthDistance: number;
      thisMonthActivities: number;
      averageActivityDistance: number;
    };
  };
}

const insightsCache = new Map<string, { data: InsightsPayload; expiresAt: number }>();

export async function GET() {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('GET', '/api/strava/insights');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.warn('Unauthorized access attempt to Strava insights');
      return ErrorResponses.unauthorized();
    }

    // Rate limiting
    const headersList = await headers();
    const identifier = getClientIdentifier(headersList, session.user.id);
    if (!rateLimiter.check(identifier, RateLimits.data)) {
      logger.warn('Rate limit exceeded for Strava insights', { identifier });
      return ErrorResponses.badRequest('Rate limit exceeded. Please try again later.');
    }

    const cacheKey = `insights:${session.user.id}`;
    const cached = insightsCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      logger.info('Serving cached Strava insights', { userId: session.user.id });
      const duration = Date.now() - startTime;
      logger.apiResponse('GET', '/api/strava/insights', 200, duration, {
        cache: true,
        activitiesCount: cached.data.weeklySummary.totalActivities,
      });

      return successResponse(cached.data);
    }

    const stravaClient = new StravaClient(prisma);
    const tokenResult = await stravaClient.getValidAccessToken(session.user.id);

    if (!tokenResult) {
      logger.warn('Strava not connected for user', { userId: session.user.id });
      return ErrorResponses.badRequest('Strava account not connected.');
    }

    const referenceDate = new Date();
    const thirtyDaysAgo = subDays(referenceDate, 30);
    const afterEpoch = Math.floor(thirtyDaysAgo.getTime() / 1000);

    const activities = await stravaClient.fetchActivities(tokenResult.accessToken, 200, {
      cacheKey: `activities:${session.user.id}:${afterEpoch}`,
      ttlMs: 15 * 60 * 1000, // Increased to 15 minutes
      after: afterEpoch,
    }) as StravaActivity[];

    // Calculate insights
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(referenceDate, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(referenceDate, 1), { weekStartsOn: 1 });
    const monthStart = startOfMonth(referenceDate);

    // This week's activities
    const thisWeekActivities = activities.filter(a => {
      const activityDate = new Date(a.start_date);
      return activityDate >= weekStart && activityDate <= weekEnd;
    });

    // Last week's activities
    const lastWeekActivities = activities.filter(a => {
      const activityDate = new Date(a.start_date);
      return activityDate >= lastWeekStart && activityDate <= lastWeekEnd;
    });

    // This month's activities
    const thisMonthActivities = activities.filter(a => {
      const activityDate = new Date(a.start_date);
      return activityDate >= monthStart;
    });

    // Weekly summary
    const weeklySummary = {
      totalActivities: thisWeekActivities.length,
      totalDistance: thisWeekActivities.reduce((sum, a) => sum + (a.distance || 0), 0),
      totalTime: thisWeekActivities.reduce((sum, a) => sum + (a.moving_time || 0), 0),
      totalElevation: thisWeekActivities.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0),
      lastWeekDistance: lastWeekActivities.reduce((sum, a) => sum + (a.distance || 0), 0),
      lastWeekActivities: lastWeekActivities.length,
    };

    // Training insights
    const last30Days = activities.filter(a => {
      const activityDate = new Date(a.start_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return activityDate >= thirtyDaysAgo;
    });

    // Calculate consistency (days with activities in last 30 days)
    const daysWithActivities = new Set(
      last30Days.map(a => new Date(a.start_date).toDateString())
    ).size;

    // Calculate average pace for runs
    const runs = last30Days.filter(a => a.type === 'Run');
    const avgPace = runs.length > 0
      ? runs.reduce((sum, a) => sum + (a.average_speed || 0), 0) / runs.length
      : 0;

    // Find longest activity this month
    const longestActivity = thisMonthActivities.reduce((max, a) =>
      (a.distance > (max?.distance || 0)) ? a : max
    , thisMonthActivities[0]);

    // Calculate week-over-week improvement
    const weekOverWeekDistance = weeklySummary.lastWeekDistance > 0
      ? ((weeklySummary.totalDistance - weeklySummary.lastWeekDistance) / weeklySummary.lastWeekDistance) * 100
      : 0;

    const insights = {
      consistency: {
        daysActive: daysWithActivities,
        totalDays: 30,
        percentage: Math.round((daysWithActivities / 30) * 100),
        trend: (daysWithActivities >= 15 ? 'good' : daysWithActivities >= 8 ? 'fair' : 'low') as 'good' | 'fair' | 'low'
      },
      performance: {
        averagePace: avgPace,
        totalRuns: runs.length,
        longestActivity: longestActivity ? {
          name: longestActivity.name,
          distance: longestActivity.distance,
          type: longestActivity.type,
          date: longestActivity.start_date
        } : null,
        weekOverWeekImprovement: weekOverWeekDistance
      },
      goals: {
        thisMonthDistance: thisMonthActivities.reduce((sum, a) => sum + (a.distance || 0), 0),
        thisMonthActivities: thisMonthActivities.length,
        averageActivityDistance: thisMonthActivities.length > 0
          ? thisMonthActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / thisMonthActivities.length
          : 0
      }
    };

    const payload: InsightsPayload = {
      weeklySummary,
      insights,
    };

    insightsCache.set(cacheKey, {
      data: payload,
      expiresAt: Date.now() + 2 * 60 * 1000,
    });

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/strava/insights', 200, duration, {
      activitiesCount: activities.length,
    });

    return successResponse(payload);
  });
}
