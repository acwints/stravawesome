'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const COLORS = {
  DARK: '#100333',
  DARKER: '#0A0221',
  CARD_BG: 'rgba(26, 26, 31, 0.7)',
};

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen p-8" style={{ 
      background: `linear-gradient(135deg, ${COLORS.DARKER} 0%, ${COLORS.DARK} 100%)`
    }}>
      <div className="max-w-7xl mx-auto">
        <div className="p-8 rounded-lg text-center" style={{ background: COLORS.CARD_BG }}>
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            Something went wrong!
          </h2>
          <p className="text-gray-300 mb-8">
            {error.message || 'An error occurred while loading your dashboard.'}
          </p>
          <div className="space-x-4">
            <button
              onClick={reset}
              className="bg-strava-orange hover:bg-strava-orange-dark text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 