'use client';

import { useEffect, useState } from 'react';
import { DashboardStats } from '@/types/app';

export default function StatsOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalActivities: 0,
    totalDistance: 0,
    totalTime: 0,
    totalElevation: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/strava/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500">Total Activities</h3>
        <p className="text-2xl font-bold">{stats.totalActivities}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500">Total Distance</h3>
        <p className="text-2xl font-bold">{(stats.totalDistance / 1609.34).toFixed(1)} mi</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500">Total Time</h3>
        <p className="text-2xl font-bold">{Math.round(stats.totalTime / 3600)} hrs</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500">Total Elevation</h3>
        <p className="text-2xl font-bold">{Math.round(stats.totalElevation)} m</p>
      </div>
    </div>
  );
} 