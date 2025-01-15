import { ACTIVITY_TYPES } from '@/constants';

export function GoalsSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">2025 Goals Progress</h2>
          <p className="text-sm text-gray-600 mt-1">Track your annual activity goals</p>
        </div>
        <div className="w-24 h-10 bg-gray-100 rounded-md animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTIVITY_TYPES.map(({ type, label }) => (
          <div key={type} className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{label}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
                <div className="w-12 h-4 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyChartSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Activity Summary</h2>
      <div className="h-[400px] bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-400">Loading chart data...</p>
      </div>
    </div>
  );
}

export function RecentActivitiesSkeleton() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-100 rounded animate-pulse" />
              <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="w-16 h-8 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
} 