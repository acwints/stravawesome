'use client';

import useSWR from 'swr';
import { StravaActivity } from '@/types';
import { fetchActivities } from '@/services/api';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { METERS_TO_MILES } from '@/constants';

const activityIcons: Record<string, JSX.Element> = {
  Run: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
    </svg>
  ),
  Ride: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  Swim: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
};

const getActivityColor = (type: string) => {
  const colors: Record<string, string> = {
    Run: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    Ride: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    Swim: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };
  return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
};

export default function RecentActivities() {
  const { data: activities, error } = useSWR<StravaActivity[]>('/api/strava/activities', fetchActivities, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) return null;
  if (!activities) return null;

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activities</h3>
      <div className="space-y-3">
        {activities.slice(0, 5).map((activity, index) => {
          const icon = activityIcons[activity.type] || activityIcons.Run;
          const colorClass = getActivityColor(activity.type);
          const pace = activity.average_speed > 0
            ? (26.8224 / activity.average_speed)
            : null;

          return (
            <div
              key={activity.id}
              className="group relative bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Activity Icon */}
                <div className={`p-3 rounded-lg ${colorClass} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
                  {icon}
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {activity.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDistanceToNow(new Date(activity.start_date), { addSuffix: true })}
                    </span>
                    {pace && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {Math.floor(pace)}:{Math.round((pace % 1) * 60).toString().padStart(2, '0')}/mi
                      </span>
                    )}
                  </div>
                </div>

                {/* Distance Badge */}
                <div className="text-right flex-shrink-0">
                  <div className="inline-flex items-baseline gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-primary-300 dark:group-hover:border-primary-600 transition-colors">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {(activity.distance * METERS_TO_MILES).toFixed(1)}
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">mi</span>
                  </div>
                </div>
              </div>

              {/* Hover Effect Gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          );
        })}
      </div>
    </>
  );
} 