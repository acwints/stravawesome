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

  const stats = [
    {
      label: 'Activities',
      value: summary.totalActivities,
      comparison: summary.totalActivities - summary.lastWeekActivities,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: 'Distance',
      value: `${(summary.totalDistance * METERS_TO_MILES).toFixed(1)} mi`,
      comparison: distanceChange,
      isPercentage: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Time',
      value: formatTime(summary.totalTime),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Elevation',
      value: `${(summary.totalElevation * METERS_TO_FEET).toFixed(0)} ft`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-3 -mx-3 transition-all duration-200"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg group-hover:scale-110 transition-transform duration-200">
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                  {stat.value}
                </p>
              </div>
            </div>
            {stat.comparison !== undefined && (
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
                    stat.comparison > 0
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                      : stat.comparison < 0
                      ? 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {stat.comparison > 0 ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : stat.comparison < 0 ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : null}
                  {stat.isPercentage
                    ? `${Math.abs(stat.comparison).toFixed(0)}%`
                    : Math.abs(stat.comparison)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
