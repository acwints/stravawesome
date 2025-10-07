'use client';

import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';

export default function SignIn() {
  const [googleReady, setGoogleReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const missingConfigMessage = 'Google sign-in is not configured. Add your Google OAuth credentials to the environment.';

  useEffect(() => {
    let active = true;

    void getProviders()
      .then((providers) => {
        if (!active) return;
        const providerExists = Boolean(providers?.google);
        setGoogleReady(providerExists);
        if (!providerExists) {
          setError(missingConfigMessage);
        }
      })
      .catch(() => {
        if (!active) return;
        setError(missingConfigMessage);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    if (!googleReady || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackUrl = origin ? `${origin}/dashboard` : '/dashboard';

    try {
      const result = await signIn('google', { callbackUrl });

      if (result?.error) {
        setError('Unable to start Google sign-in. Verify your Google OAuth credentials.');
      }
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Unable to start Google sign-in. Verify your Google OAuth credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Connect with your Google account to get started
          </p>
        </div>
        {error ? (
          <p className="text-sm text-red-600 text-center" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={!googleReady || loading}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={!googleReady || loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
} 