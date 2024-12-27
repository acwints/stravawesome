'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const COLORS = {
  DARKER: '#0A0211',
  ACCENT: 'rgba(252, 76, 2, 0.1)', // Strava orange with opacity
};

export default function Header() {
  const { data: session } = useSession();

  return (
    <nav 
      className="p-6 shadow-xl fixed top-0 left-0 right-0 z-50 h-32 backdrop-blur-md"
      style={{ 
        background: `linear-gradient(180deg, ${COLORS.DARKER} 90%, ${COLORS.ACCENT})`,
        borderBottom: '2px solid rgba(252, 76, 2, 0.3)'
      }}
    >
      <div className="container mx-auto flex justify-between items-center h-full">
        <div className="flex items-center">
          <Link href="/" className="relative group">
            <Image 
              src="/images/StravAwesome.png" 
              alt="StravAwesome" 
              width={280}
              height={120}
              className="mr-4 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
          </Link>
        </div>
        
        {session?.user && (
          <div className="flex items-center gap-6">
            <span className="text-strava-light text-xl font-medium tracking-wide">
              {session.user.name}
            </span>
            {session.user.image && (
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={60}
                  height={60}
                  className="rounded-full border-2 border-strava-orange shadow-lg transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 