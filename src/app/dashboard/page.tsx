'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GoalsSkeleton, WeeklyChartSkeleton, RecentActivitiesSkeleton } from '@/components/ui/Skeleton';
import StravaConnect from '@/components/StravaConnect';
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Welcome back, {session.user?.name}!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {session.user.stravaConnected
              ? "Your Strava account is connected. View your activities below."
              : "Connect your Strava account to start tracking your activities."}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <StravaConnect />
        </div>
      </div>

      {session.user.stravaConnected && (
        <>
          <Suspense fallback={<GoalsSkeleton />}>
            <GoalsProgress />
          </Suspense>

          <Suspense fallback={<WeeklyChartSkeleton />}>
            <WeeklyChart />
          </Suspense>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 lg:col-span-2">
              <Suspense fallback={<RecentActivitiesSkeleton />}>
                <RecentActivities />
              </Suspense>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Weekly Summary</h3>
              <Suspense fallback={
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              }>
                <WeeklySummary />
              </Suspense>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIChat />
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Training Insights</h3>
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

          <div className="grid grid-cols-1 gap-6">
            <TrainingMapWrapper />
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