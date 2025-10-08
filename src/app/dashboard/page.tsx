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
import WeeklySummary from '@/components/WeeklySummary';
import TrainingInsights from '@/components/TrainingInsights';
import { Session } from "next-auth";

function LoadingSpinner() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

function DashboardContent({ session }: { session: Session }) {
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
    <div className="space-y-6 animate-fade-in">

      {/* AI Chat - Full Width at Top */}
      <AIChat />

      {/* Goals Progress */}
      <Suspense fallback={<GoalsSkeleton />}>
        <GoalsProgress />
      </Suspense>

      {/* Weekly Chart */}
      <Suspense fallback={<WeeklyChartSkeleton />}>
        <WeeklyChart />
      </Suspense>

      {/* Three Column Layout: Recent Activities, Weekly Summary, Training Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 lg:col-span-2 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <Suspense fallback={<RecentActivitiesSkeleton />}>
            <RecentActivities />
          </Suspense>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Weekly Summary</h3>
            </div>
            <Suspense fallback={
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            }>
              <WeeklySummary />
            </Suspense>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Training Insights</h3>
            </div>
            <Suspense fallback={
              <div className="space-y-4 animate-pulse">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            }>
              <TrainingInsights />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Training Map */}
      <div className="grid grid-cols-1 gap-6">
        <TrainingMapWrapper />
      </div>
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