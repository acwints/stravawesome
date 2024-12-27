'use client';

import { signIn } from "next-auth/react";
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const COLORS = {
  DARK: '#100333',    // Dark purple
  DARKER: '#0A0221',  // Darker purple for gradient
  CARD_BG: 'rgba(26, 26, 31, 0.7)', // Semi-transparent dark for cards
};

export default function SignIn() {
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
              Welcome to Stravawesome
            </h2>
            <p className="mt-2 text-strava-light opacity-80">
              Connect your Strava account to access your personalized dashboard
            </p>
          </div>
          <div className="mt-12 flex flex-col items-center gap-8">
            <button
              onClick={() => signIn("strava", { callbackUrl: "/" })}
              className="w-full flex justify-center items-center hover:opacity-90 transition-all transform hover:scale-105"
            >
              <Image
                src="/1.1 connect with strava/btn_strava_connectwith_orange.png"
                alt="Connect with Strava"
                width={193}
                height={48}
                priority
                className="max-w-[193px]"
              />
            </button>
            
            <div className="opacity-80 hover:opacity-100 transition-opacity">
              <Image
                src="/1.2 strava api logos/powered by Strava/pwrdBy_strava_white/api_logo_pwrdBy_strava_horiz_white.svg"
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