'use client';

import { useSession } from 'next-auth/react';

export default function StravaConnect() {
  const { data: session } = useSession();

  const connectStrava = () => {
    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=143565&response_type=code&redirect_uri=${encodeURIComponent(
      'http://localhost:3000/api/strava/callback'
    )}&scope=activity:read_all,profile:read_all`;

    window.location.href = stravaAuthUrl;
  };

  if (!session) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Strava Connection</h3>
      {session.user.stravaConnected ? (
        <div className="text-green-600 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Connected to Strava
        </div>
      ) : (
        <button
          onClick={connectStrava}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.008 13.828h4.172" />
          </svg>
          Connect with Strava
        </button>
      )}
    </div>
  );
} 