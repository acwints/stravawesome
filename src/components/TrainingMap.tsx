'use client';

import dynamic from 'next/dynamic';
import { StravaActivity } from '@/types';

const TrainingMapClient = dynamic(() => import('./TrainingMapClient'), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Training Locations</h3>
      <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
    </div>
  ),
});

interface TrainingMapProps {
  activities: StravaActivity[];
}

export default function TrainingMap({ activities }: TrainingMapProps) {
  return <TrainingMapClient activities={activities} />;
}