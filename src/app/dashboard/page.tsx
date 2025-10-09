'use client';

import { Suspense } from 'react';
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
import { Session } from "next-auth";

function LoadingSpinner() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

function DashboardContent({ session }: { session: Session }) {
  // Premium features are now available to all users

  if (!session.user.stravaConnected) {
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
      {/* Activity Heatmap - FREE */}
      <Suspense fallback={
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
          <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      }>
        <ActivityHeatmap />
      </Suspense>

      {/* All features now available to everyone */}
      <AIChat />

      <Suspense fallback={<GoalsSkeleton />}>
        <GoalsProgress />
      </Suspense>

      <Suspense fallback={<WeeklyChartSkeleton />}>
        <WeeklyChart />
      </Suspense>

      <Suspense fallback={<RecentActivitiesSkeleton />}>
        <RecentActivities />
      </Suspense>

      <Suspense fallback={
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      }>
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

  return <DashboardContent session={session} />;
} 