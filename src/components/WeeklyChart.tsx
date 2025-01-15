'use client';

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

export function WeeklyChartSkeleton() {
  const skeletonHeights = [45, 60, 30, 50, 40]; // Fixed heights for consistent rendering
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
      <div className="h-[400px] bg-gray-100 rounded animate-pulse flex items-end p-4">
        {skeletonHeights.map((height, i) => (
          <div key={i} className="flex-1 mx-2">
            <div className="bg-gray-200 rounded" style={{ height: `${height}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WeeklyChart() {
  const { data: activities, error } = useSWR<StravaActivity[]>('/api/strava/activities', fetchActivities, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) return null;
  if (!activities) return <WeeklyChartSkeleton />;

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
  );
} 