'use client';

import Image from 'next/image';

const COLORS = {
  DARKER: '#0A0221',
  ACCENT: 'rgba(252, 76, 2, 0.1)', // Strava orange with opacity
};

export default function Footer() {
  return (
    <footer 
      className="w-full py-8 mt-12"
      style={{ 
        background: COLORS.DARKER,
        borderTop: `2px solid ${COLORS.ACCENT}`
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-6">
          <div>
            <Image
              src="/1.2 strava api logos/powered by Strava/pwrdBy_strava_white/api_logo_pwrdBy_strava_horiz_white.svg"
              alt="Powered by Strava"
              width={193}
              height={48}
              className="max-w-[193px]"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://www.strava.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-strava-orange transition-colors text-sm font-bold"
              style={{ color: '#FC4C02' }}
            >
              View on Strava
            </a>
            <span className="text-white">•</span>
            <a 
              href="https://github.com/yourusername/stravawesome" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-strava-orange transition-colors text-sm"
            >
              GitHub
            </a>
          </div>
          
          <p className="text-white text-sm">
            This app is not sponsored by or affiliated with Strava
          </p>
        </div>
      </div>
    </footer>
  );
} 