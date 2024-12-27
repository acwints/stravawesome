'use client';

import ActivityCharts from '../activities/ActivityCharts';
import StatsOverview from './StatsOverview';

export default function DashboardContent() {
  return (
    <div className="space-y-8">
      <StatsOverview />
      <ActivityCharts />
    </div>
  );
} 