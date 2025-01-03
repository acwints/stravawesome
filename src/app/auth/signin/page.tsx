'use client';

import { signIn } from "next-auth/react";
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useSearchParams } from 'next/navigation';

const COLORS = {
  DARK: '#100333',    // Dark purple
  DARKER: '#0A0221',  // Darker purple for gradient
  CARD_BG: 'rgba(26, 26, 31, 0.7)', // Semi-transparent dark for cards
};

function debugLog(message: string, data?: any) {
  console.log(`[SignIn] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

export default function SignIn() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleStravaSignIn = async () => {
    debugLog('Initiating Strava sign-in', { callbackUrl });
    try {
      const result = await signIn('strava', {
        callbackUrl,
        redirect: false,
      });
      
      debugLog('Sign-in result:', result);
      
      if (result?.error) {
        console.error('Sign-in error:', result.error);
      }
    } catch (error) {
      debugLog('Sign-in error:', error);
    }
  };

  return (
    <div style={{ 
      background: `linear-gradient(135deg, ${COLORS.DARKER} 0%, ${COLORS.DARK} 100%)`,
      minHeight: '100vh'
    }}>
      <Header />
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div 
          className="max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg border border-opacity-10 border-white backdrop-blur-md"
          style={{ background: COLORS.CARD_BG }}
        >
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-strava-light">
              Welcome to StravAwesome
            </h2>
            <p className="mt-2 text-strava-light opacity-80">
              Connect your Strava account to access your personalized dashboard
            </p>
            {error && (
              <p className="mt-4 text-red-500">
                {error === 'OAuthSignin' ? 'Error connecting to Strava. Please try again.' :
                 error === 'OAuthCallback' ? 'Error with Strava callback. Please try again.' :
                 error === 'OAuthCreateAccount' ? 'Error creating account. Please try again.' :
                 error === 'AccessDenied' ? 'Access was denied. Please grant the required permissions.' :
                 'An error occurred. Please try again.'}
              </p>
            )}
          </div>
          <div className="mt-12 flex flex-col items-center gap-8">
            <button
              onClick={handleStravaSignIn}
              className="w-full flex justify-center items-center hover:opacity-90 transition-all transform hover:scale-105"
            >
              <Image
                src="/strava-assets/1.1 connect with strava/btn_strava_connectwith_orange/btn_strava_connectwith_orange.svg"
                alt="Connect with Strava"
                width={193}
                height={48}
                priority
                className="max-w-[193px]"
              />
            </button>
            
            <div className="opacity-80 hover:opacity-100 transition-opacity">
              <Image
                src="/strava-assets/1.2 strava api logos/powered by Strava/pwrdBy_strava_white/api_logo_pwrdBy_strava_horiz_white.svg"
                alt="Powered by Strava"
                width={193}
                height={48}
                className="max-w-[193px]"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 