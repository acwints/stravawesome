'use client';

import { useEffect, useState } from 'react';
import { DATE_FORMAT_OPTIONS } from '@/constants';

interface Activity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  average_speed: number;
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const response = await fetch('/api/strava/activities');
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        const data = await response.json();
        setActivities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  if (loading) {
    return <p className="text-gray-600">Loading your recent activities...</p>;
  }

  if (error) {
    return <p className="text-red-600">Error: {error}</p>;
  }

  if (activities.length === 0) {
    return <p className="text-gray-600">No recent activities found.</p>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="border rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">{activity.name}</h4>
              <p className="text-sm text-gray-500">{activity.type}</p>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(activity.start_date).toLocaleDateString(undefined, DATE_FORMAT_OPTIONS)}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Distance:</span>{' '}
              {(activity.distance / 1000).toFixed(2)} km
            </div>
            <div>
              <span className="font-medium">Time:</span>{' '}
              {Math.floor(activity.moving_time / 60)} min
            </div>
            <div>
              <span className="font-medium">Avg Speed:</span>{' '}
              {(activity.average_speed * 3.6).toFixed(1)} km/h
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 