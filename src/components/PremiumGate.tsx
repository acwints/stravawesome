'use client';

import { ReactNode } from 'react';

interface PremiumGateProps {
  children: ReactNode;
  isPremium: boolean;
  featureName: string;
  className?: string;
}

export default function PremiumGate({
  children,
  isPremium,
  featureName,
  className = '',
}: PremiumGateProps) {
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="pointer-events-none select-none blur-sm opacity-30 min-h-[120px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-[2px]">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/50">
            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{featureName}</p>
            <a href="/pricing" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
              Upgrade to unlock
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
