'use client';

import useSWR from 'swr';
import { METERS_TO_MILES, METERS_TO_FEET } from '@/constants';

interface WeeklySummaryData {
  totalActivities: number;
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
  lastWeekDistance: number;
  lastWeekActivities: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WeeklySummary() {
  const { data, error } = useSWR<{ weeklySummary: WeeklySummaryData }>(
    '/api/strava/insights',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Weekly Summary</h3>
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load summary</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Weekly Summary</h3>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const summary = data.weeklySummary;
  const distanceChange = summary.lastWeekDistance > 0
    ? ((summary.totalDistance - summary.lastWeekDistance) / summary.lastWeekDistance) * 100
    : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Activities</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.totalActivities}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">vs Last Week</p>
          <p className={`text-sm font-medium ${
            summary.totalActivities >= summary.lastWeekActivities
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {summary.totalActivities >= summary.lastWeekActivities ? '+' : ''}
            {summary.totalActivities - summary.lastWeekActivities}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {(summary.totalDistance * METERS_TO_MILES).toFixed(1)} mi
          </p>
        </div>
        {distanceChange !== 0 && (
          <p className={`text-xs ${
            distanceChange > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {distanceChange > 0 ? '↑' : '↓'} {Math.abs(distanceChange).toFixed(0)}% from last week
          </p>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatTime(summary.totalTime)}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Elevation</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {(summary.totalElevation * METERS_TO_FEET).toFixed(0)} ft
          </p>
        </div>
      </div>
    </div>
  );
}
