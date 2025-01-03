'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const COLORS = {
  DARK: '#100333',    // Dark purple
  DARKER: '#0A0221',  // Darker purple for gradient
  CARD_BG: 'rgba(26, 26, 31, 0.7)', // Semi-transparent dark for cards
};

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

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
              Authentication Error
            </h2>
            <p className="mt-2 text-strava-light opacity-80">
              {error || 'An error occurred during authentication'}
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-strava-orange hover:bg-opacity-90 transition-all transform hover:scale-105 font-medium"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 