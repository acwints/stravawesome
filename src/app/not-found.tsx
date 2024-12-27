import Link from 'next/link';

const COLORS = {
  DARK: '#100333',
  DARKER: '#0A0221',
  CARD_BG: 'rgba(26, 26, 31, 0.7)',
};

export default function NotFound() {
  return (
    <div className="min-h-screen p-8" style={{ 
      background: `linear-gradient(135deg, ${COLORS.DARKER} 0%, ${COLORS.DARK} 100%)`
    }}>
      <div className="max-w-7xl mx-auto">
        <div className="p-8 rounded-lg text-center" style={{ background: COLORS.CARD_BG }}>
          <h2 className="text-2xl font-bold text-strava-orange mb-4">
            404 - Page Not Found
          </h2>
          <p className="text-gray-300 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <div className="space-x-4">
            <Link
              href="/"
              className="bg-strava-orange hover:bg-strava-orange-dark text-white font-bold py-2 px-4 rounded transition-colors inline-block"
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 