'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function StravaConnectButton() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [showError, setShowError] = useState(false);

  const connectStrava = async (force = false) => {
    try {
      const url = new URL('/api/strava/auth-url', window.location.origin);
      if (force) {
        url.searchParams.set('force', 'true');
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Failed to get Strava auth URL:', data.error);
        return;
      }

      sessionStorage.setItem('stravaOAuthState', data.state);
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting to Strava:', error);
    }
  };

  if (!session) return null;

  if (session.user.stravaConnected) {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">Strava Connected</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => error === 'already_connected' ? setShowError(!showError) : connectStrava(false)}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.008 13.828h4.172" />
        </svg>
        Connect Strava
      </button>

      {error === 'already_connected' && showError && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 p-4 z-10">
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
            This Strava account is already connected to another user.
          </p>
          <button
            onClick={() => connectStrava(true)}
            className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
          >
            Connect Different Account
          </button>
        </div>
      )}
    </div>
  );
}
