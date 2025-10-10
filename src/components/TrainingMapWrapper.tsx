'use client';

import { useDashboardData } from './DashboardDataProvider';
import TrainingMap from './TrainingMap';

export default function TrainingMapWrapper() {
  const { activities, error, isLoading, stravaConnected } = useDashboardData();

  if (!stravaConnected) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Locations</h3>
        <p className="text-red-600">Error loading activities</p>
      </div>
    );
  }

  if (isLoading || !activities) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Locations</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  return <TrainingMap activities={activities} />;
}