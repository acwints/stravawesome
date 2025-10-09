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
import { useSubscription } from '@/hooks/useSubscription';
import { Session } from "next-auth";

function LoadingSpinner() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

function DashboardContent({ session }: { session: Session }) {
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();

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

      {/* Everything else - Single Premium Gate */}
      {isPremium || subscriptionLoading ? (
        <>
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
        </>
      ) : (
        <>
          {/* Blurred Preview */}
          <div className="relative">
            <div className="blur-sm pointer-events-none select-none opacity-60">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-4">
                <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-4">
                <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-4">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-4">
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded" />
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>

            {/* Overlay with CTA */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Unlock All Features
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  <span className="font-bold text-primary-600 dark:text-primary-400">$12/year</span> after 7-day free trial
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                  Cancel anytime before trial ends — no charge
                </p>
                <a
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Start Free Trial
                </a>
              </div>
            </div>
          </div>
        </>
      )}
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