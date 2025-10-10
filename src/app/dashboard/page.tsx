'use client';

import { Suspense, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GoalsSkeleton, WeeklyChartSkeleton, RecentActivitiesSkeleton } from '@/components/ui/Skeleton';
import GoalsProgress from '@/components/GoalsProgress';
import RecentActivities from '@/components/RecentActivities';
import WeeklyChart from '@/components/WeeklyChart';
import AIChat from '@/components/AIChat';
import TrainingMapWrapper from '@/components/TrainingMapWrapper';
import PhotoGallery from '@/components/PhotoGallery';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import { DashboardDataProvider, useDashboardData } from '@/components/DashboardDataProvider';
import { disconnectStrava } from '@/services/api';

function LoadingSpinner() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

function DashboardContent() {
  const { reauthRequired, error, stravaConnected } = useDashboardData();
  const [isReconnecting, setIsReconnecting] = useState(false);

  const startStravaAuth = async (force = false) => {
    if (typeof window === 'undefined') return;

    const url = new URL('/api/strava/auth-url', window.location.origin);
    if (force) {
      url.searchParams.set('force', 'true');
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    sessionStorage.setItem('stravaOAuthState', data.state);
    window.location.href = data.url;
  };

  const handleReconnect = async () => {
    if (isReconnecting) return;
    setIsReconnecting(true);

    try {
      await disconnectStrava();
      await startStravaAuth(true);
    } catch (err) {
      console.error('Failed to reconnect Strava:', err);
      setIsReconnecting(false);
      alert('Unable to start the Strava reconnect flow. Please try again.');
    }
  };

  // Premium features are now available to all users

  if (reauthRequired) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 max-w-md text-center space-y-4">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.008 13.828h4.172" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reconnect Your Strava Account</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your Strava connection has expired. Reconnect to resume syncing your activities.
            </p>
            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
          <div className="space-y-2">
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-strava hover:bg-strava-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-sm rounded-lg shadow transition-colors"
            >
              {isReconnecting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Redirecting to Strava…</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.008 13.828h4.172" />
                  </svg>
                  <span>Reconnect with Strava</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Tip: If you revoked access in Strava, reconnecting will prompt you to authorize the app again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!stravaConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 max-w-md text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.008 13.828h4.172" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Connect Your Strava Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your Strava account to view your activities, track your progress, and get AI-powered insights.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Click &quot;Connect Strava&quot; in the navigation bar above to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AIChat />

      {/* Activity Heatmap - FREE */}
      <Suspense
        fallback={
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
            <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        }
      >
        <ActivityHeatmap />
      </Suspense>

      <Suspense fallback={<GoalsSkeleton />}>
        <GoalsProgress />
      </Suspense>

      <Suspense fallback={<WeeklyChartSkeleton />}>
        <WeeklyChart />
      </Suspense>

      <Suspense fallback={<RecentActivitiesSkeleton />}>
        <RecentActivities />
      </Suspense>

      <Suspense
        fallback={
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        }
      >
        <PhotoGallery />
      </Suspense>

      <TrainingMapWrapper />
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (!session) return null;

  return (
    <DashboardDataProvider>
      <DashboardContent />
    </DashboardDataProvider>
  );
}
