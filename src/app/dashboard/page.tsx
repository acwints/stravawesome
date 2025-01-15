'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { StravaActivity, ActivityData } from '@/types';
import { fetchActivities } from '@/services/api';
import { COLORS } from '@/constants';
import GoalsProgress from '@/components/GoalsProgress';
import StravaConnect from '@/components/StravaConnect';
import RecentActivities from '@/components/RecentActivities';
import { GoalsSkeleton } from '@/components/ui/Skeleton';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

function CustomTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <p className="font-medium">Week of {label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {Math.round(entry.value as number)} miles
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function ActivitiesContent() {
  const { data: activities, error } = useSWR<StravaActivity[]>('/api/strava/activities', fetchActivities, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) return null;
  if (!activities) return <GoalsSkeleton />;

  // Process activities into weekly data for chart
  const weeklyData = new Map<string, { fullDate: string; running: number; cycling: number }>();

  activities.forEach((activity) => {
    const date = new Date(activity.start_date);
    const week = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const distanceInMiles = activity.distance * 0.000621371;

    if (!weeklyData.has(week)) {
      weeklyData.set(week, { 
        fullDate: activity.start_date,
        running: 0, 
        cycling: 0 
      });
    }

    const currentWeek = weeklyData.get(week)!;
    if (activity.type === 'Run') {
      currentWeek.running += distanceInMiles;
    } else if (activity.type === 'Ride') {
      currentWeek.cycling += distanceInMiles;
    }
  });

  const activityData: ActivityData[] = Array.from(weeklyData.entries())
    .map(([week, data]) => ({
      week,
      fullDate: data.fullDate,
      running: Math.round(data.running * 10) / 10,
      cycling: Math.round(data.cycling * 10) / 10,
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  return (
    <>
      <GoalsProgress activities={activities} />
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Activity Summary</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="running"
                name="Running"
                fill={COLORS.PRIMARY}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="cycling"
                name="Cycling"
                fill={COLORS.SECONDARY}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (!session) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome back, {session.user?.name}!</h2>
          <p className="text-gray-600">
            {session.user.stravaConnected 
              ? "Your Strava account is connected. View your activities below."
              : "Connect your Strava account to start tracking your activities."}
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <StravaConnect />
        </div>
      </div>

      {session.user.stravaConnected && (
        <Suspense fallback={<GoalsSkeleton />}>
          <ActivitiesContent />
        </Suspense>
      )}

      {session.user.stravaConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <RecentActivities />
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Summary</h3>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
} 