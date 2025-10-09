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
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Premium overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50/95 via-white/90 to-gray-100/95 dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/95 backdrop-blur-sm">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Premium Feature
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Unlock <span className="font-semibold">{featureName}</span> and all premium features for just <span className="text-primary-600 dark:text-primary-400 font-bold">$12/year</span>
          </p>

          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Upgrade to Premium
          </a>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
            Activity Calendar remains free forever
          </p>
        </div>
      </div>
    </div>
  );
}
