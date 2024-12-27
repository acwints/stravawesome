import Link from 'next/link';

const COLORS = {
  DARK: '#100333',
  DARKER: '#0A0221',
  CARD_BG: 'rgba(26, 26, 31, 0.7)',
};

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen p-8" style={{ 
      background: `linear-gradient(135deg, ${COLORS.DARKER} 0%, ${COLORS.DARK} 100%)`
    }}>
      <div className="max-w-7xl mx-auto">
        <div className="p-8 rounded-lg text-center" style={{ background: COLORS.CARD_BG }}>
          <h2 className="text-2xl font-bold text-strava-orange mb-4">
            Dashboard Not Found
          </h2>
          <p className="text-gray-300 mb-8">
            We couldn't find the dashboard you're looking for. This might be because:
          </p>
          <ul className="text-gray-300 mb-8 list-disc list-inside">
            <li>Your session has expired</li>
            <li>You haven't synced any activities yet</li>
            <li>There was an error loading your data</li>
          </ul>
          <div className="space-x-4">
            <Link
              href="/"
              className="bg-strava-orange hover:bg-strava-orange-dark text-white font-bold py-2 px-4 rounded transition-colors inline-block"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 