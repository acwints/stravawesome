import React from 'react';

const COLORS = {
  DARK: '#100333',
  DARKER: '#0A0221',
  CARD_BG: 'rgba(26, 26, 31, 0.7)',
};

export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-8" style={{ 
      background: `linear-gradient(135deg, ${COLORS.DARKER} 0%, ${COLORS.DARK} 100%)`
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Activity Charts Skeleton */}
        <div className="mb-8 p-6 rounded-lg animate-pulse" style={{ background: COLORS.CARD_BG }}>
          <div className="h-8 w-48 bg-gray-700 rounded mb-4" />
          <div className="h-[400px] bg-gray-700 rounded" />
        </div>

        {/* Activity List Skeleton */}
        <div className="p-6 rounded-lg" style={{ background: COLORS.CARD_BG }}>
          <div className="h-8 w-48 bg-gray-700 rounded mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 rounded-lg bg-gray-800">
                <div className="h-12 w-12 bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-700 rounded" />
                  <div className="h-4 w-1/2 bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 