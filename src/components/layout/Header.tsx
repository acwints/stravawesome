'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import LogoutButton from '@/components/auth/LogoutButton';

const COLORS = {
  DARKER: '#0A0211',
  ACCENT: 'rgba(252, 76, 2, 0.1)', // Strava orange with opacity
};

export default function Header() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="relative group focus:outline-none"
                >
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={60}
                    height={60}
                    className="rounded-full border-2 border-strava-orange shadow-lg transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
                
                {isMenuOpen && (
                  <div 
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50"
                    style={{ background: COLORS.DARKER }}
                  >
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm text-strava-light">Signed in as</p>
                      <p className="text-sm font-medium text-strava-light truncate">
                        {session.user.name}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-strava-light hover:bg-gray-800"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <div className="px-4 py-2">
                        <LogoutButton />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 