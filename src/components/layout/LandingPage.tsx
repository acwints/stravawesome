'use client';

import Link from "next/link";
import Image from "next/image";
import Header from './Header';
import Footer from './Footer';

const COLORS = {
  DARK: '#100333',    // Dark purple
  DARKER: '#0A0221',  // Darker purple for gradient
  CARD_BG: 'rgba(26, 26, 31, 0.7)', // Semi-transparent dark for cards
};

export default function LandingPage() {
  return (
    <div style={{ 
      background: `linear-gradient(135deg, ${COLORS.DARKER} 0%, ${COLORS.DARK} 100%)`,
      minHeight: '100vh'
    }}>
      <Header />
      <main className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-8">
        <div 
          className="max-w-2xl w-full space-y-8 p-12 rounded-lg shadow-lg border border-opacity-10 border-white backdrop-blur-md text-center"
          style={{ background: COLORS.CARD_BG }}
        >
          <h1 className="text-5xl font-bold text-strava-light">
            Welcome to Stravawesome
          </h1>
          <p className="text-xl text-strava-light opacity-80 max-w-lg mx-auto">
            Your personal Strava dashboard with advanced analytics and beautiful visualizations
          </p>
          <div className="flex flex-col items-center gap-8 mt-12">
            <Link
              href="/auth/signin"
              className="bg-strava-orange text-white px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 text-lg font-medium"
            >
              Get Started
            </Link>
            
            <div className="opacity-80 hover:opacity-100 transition-opacity mt-4">
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
      </main>
      <Footer />
    </div>
  );
} 