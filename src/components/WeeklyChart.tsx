'use client';

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
import { useDashboardData } from './DashboardDataProvider';
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
  const { activities, error, isLoading } = useDashboardData();

  if (error) return null;
  if (isLoading || !activities) return <WeeklyChartSkeleton />;

  // Process activities into individual data points for chart
  const activityData: ActivityData[] = activities
    .map((activity) => {
      const date = new Date(activity.start_date);
      const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const distanceInMiles = Math.round(activity.distance * 0.000621371 * 10) / 10;

      return {
        week: dateLabel,
        fullDate: activity.start_date,
        running: activity.type === 'Run' ? distanceInMiles : 0,
        cycling: activity.type === 'Ride' ? distanceInMiles : 0,
        walking: activity.type === 'Walk' ? distanceInMiles : 0,
        hiking: activity.type === 'Hike' ? distanceInMiles : 0,
      };
    })
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">All Activities</h2>
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
            <Bar
              dataKey="walking"
              name="Walking"
              fill={COLORS.WARNING}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="hiking"
              name="Hiking"
              fill={COLORS.SUCCESS}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 