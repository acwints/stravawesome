'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function StravaConnectButton() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [showError, setShowError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (error === 'already_connected') {
      setShowError(true);
    }
  }, [error]);

  const connectStrava = async (force = false) => {
    if (typeof window === 'undefined') return;

    setIsConnecting(true);
    try {
      const url = new URL('/api/strava/auth-url', window.location.origin);
      if (force) {
        url.searchParams.set('force', 'true');
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Failed to get Strava auth URL:', data.error);
        setIsConnecting(false);
        return;
      }

      sessionStorage.setItem('stravaOAuthState', data.state);
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      setIsConnecting(false);
    }
  };

  if (!session) return null;

  if (session.user.stravaConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 transition-all duration-200 animate-fade-in">
        <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-semibold">Connected</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => error === 'already_connected' ? setShowError(!showError) : connectStrava(false)}
        disabled={isConnecting}
        className="group relative inline-flex items-center gap-2 px-4 py-2 bg-strava hover:bg-strava-600 active:bg-strava-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-strava-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:cursor-not-allowed"
        aria-label={isConnecting ? "Connecting to Strava" : "Connect Strava account"}
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.008 13.828h4.172" />
            </svg>
            <span>Connect Strava</span>
          </>
        )}
      </button>

      {error === 'already_connected' && showError && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 p-4 z-50 animate-slide-down"
          role="alert"
        >
          <div className="flex items-start gap-3 mb-3">
            <svg className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Account Already Connected</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This Strava account is linked to another user.
              </p>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close error message"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => connectStrava(true)}
            disabled={isConnecting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-strava hover:bg-strava-600 active:bg-strava-700 disabled:bg-gray-300 text-white font-semibold text-sm rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-strava-500 focus:ring-offset-2 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.008 13.828h4.172" />
            </svg>
            Connect Different Account
          </button>
        </div>
      )}
    </div>
  );
}
