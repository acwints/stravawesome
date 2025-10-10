'use client';

import useSWR from 'swr';
import { METERS_TO_MILES } from '@/constants';
import { fetchInsights } from '@/services/api';
import type { StravaInsightsPayload } from '@/types';
import { useDashboardData } from './DashboardDataProvider';

export default function TrainingInsights() {
  const { stravaConnected } = useDashboardData();

  const { data, error } = useSWR<StravaInsightsPayload>(
    stravaConnected ? '/api/strava/insights' : null,
    fetchInsights,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  if (!stravaConnected) {
    return null;
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Training Insights</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg animate-pulse">
            <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-blue-100 dark:bg-blue-900 rounded w-3/4"></div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg animate-pulse">
            <div className="h-4 bg-green-200 dark:bg-green-800 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-green-100 dark:bg-green-900 rounded w-3/4"></div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg animate-pulse">
            <div className="h-4 bg-purple-200 dark:bg-purple-800 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-purple-100 dark:bg-purple-900 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const { insights } = data;

  const formatPace = (metersPerSecond: number) => {
    if (!metersPerSecond || metersPerSecond === 0) return 'N/A';
    const minutesPerMile = 26.8224 / metersPerSecond;
    const minutes = Math.floor(minutesPerMile);
    const seconds = Math.round((minutesPerMile - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'good': return 'text-green-900 dark:text-green-300';
      case 'fair': return 'text-yellow-900 dark:text-yellow-300';
      case 'low': return 'text-red-900 dark:text-red-300';
      default: return 'text-gray-900 dark:text-gray-300';
    }
  };

  const getTrendBg = (trend: string) => {
    switch (trend) {
      case 'good': return 'bg-green-50 dark:bg-green-900/20';
      case 'fair': return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'bg-red-50 dark:bg-red-900/20';
      default: return 'bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Consistency */}
      <div className={`p-4 ${getTrendBg(insights.consistency.trend)} rounded-lg transition-colors`}>
        <h4 className={`font-medium ${getTrendColor(insights.consistency.trend)} mb-2`}>
          Consistency: {insights.consistency.percentage}%
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-400">
          Active {insights.consistency.daysActive} out of {insights.consistency.totalDays} days
        </p>
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              insights.consistency.trend === 'good'
                ? 'bg-green-500'
                : insights.consistency.trend === 'fair'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${insights.consistency.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Performance */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Performance</h4>
        {insights.performance.totalRuns > 0 ? (
          <div className="space-y-1 text-sm">
            <p className="text-blue-700 dark:text-blue-400">
              Average pace: <span className="font-semibold">{formatPace(insights.performance.averagePace)}</span>
            </p>
            {insights.performance.weekOverWeekImprovement !== 0 && (
              <p className={`${
                insights.performance.weekOverWeekImprovement > 0
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {insights.performance.weekOverWeekImprovement > 0 ? '↑' : '↓'}{' '}
                {Math.abs(insights.performance.weekOverWeekImprovement).toFixed(0)}% week-over-week
              </p>
            )}
            {insights.performance.longestActivity && (
              <p className="text-blue-700 dark:text-blue-400">
                Longest: {(insights.performance.longestActivity.distance * METERS_TO_MILES).toFixed(1)} mi
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-blue-700 dark:text-blue-400">No running activities yet</p>
        )}
      </div>

      {/* Goals Progress */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-colors">
        <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2">This Month</h4>
        <div className="space-y-1 text-sm text-purple-700 dark:text-purple-400">
          <p>
            <span className="font-semibold">{insights.goals.thisMonthActivities}</span> activities
          </p>
          <p>
            <span className="font-semibold">
              {(insights.goals.thisMonthDistance * METERS_TO_MILES).toFixed(1)} mi
            </span>{' '}
            total distance
          </p>
          {insights.goals.averageActivityDistance > 0 && (
            <p>
              <span className="font-semibold">
                {(insights.goals.averageActivityDistance * METERS_TO_MILES).toFixed(1)} mi
              </span>{' '}
              avg per activity
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
