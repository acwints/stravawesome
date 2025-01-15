'use client';

import useSWR from 'swr';
import { StravaActivity } from '@/types';
import { fetchActivities } from '@/services/api';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { METERS_TO_MILES } from '@/constants';

export default function RecentActivities() {
  const { data: activities, error } = useSWR<StravaActivity[]>('/api/strava/activities', fetchActivities, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) return null;
  if (!activities) return null;

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity) => (
          <div key={activity.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">{activity.name}</h4>
                <p className="text-sm text-gray-600">
                  {formatDistanceToNow(new Date(activity.start_date), { addSuffix: true })}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  {(activity.distance * METERS_TO_MILES).toFixed(1)} mi
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
} 