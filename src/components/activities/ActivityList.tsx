'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import { StravaActivity } from '@/types/strava';

interface ActivityResponse {
  activities: StravaActivity[];
  page: number;
  hasMore: boolean;
}

export default function ActivityList() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const response = await fetch(`/api/strava/activities?page=${page}`);
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        const data: ActivityResponse = await response.json();
        setActivities(prev => [...prev, ...data.activities]);
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchActivities();
    }
  }, [session, page]);

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <div className="min-h-screen bg-strava-navy">
      <Header />
      <div className="container mx-auto px-4 pt-40 pb-20">
        <h1 className="text-3xl font-bold text-white mb-8">Your Activities</h1>
        
        {loading && activities.length === 0 ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-strava-orange"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{activity.name}</h3>
                    <p className="text-gray-600">
                      {activity.type} • {formatDate(activity.start_date)} • {formatDuration(activity.moving_time)}
                    </p>
                  </div>
                  <a
                    href={`https://www.strava.com/activities/${activity.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-600"
                  >
                    View on Strava
                  </a>
                </div>
              </div>
            ))}
            {loading && <div>Loading...</div>}
            {hasMore && !loading && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="w-full py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
} 