'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { PRICING } from '@/lib/subscription';

export default function PricingPage() {
  const { status } = useSession();
  const router = useRouter();
  const { isPremium, isLoading } = useSubscription();

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();

      if (data.success && data.data.url) {
        // Redirect to Polar checkout
        window.location.href = data.data.url;
      } else {
        throw new Error('Invalid checkout response');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Premium Features
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-1">
          <span className="font-semibold">$12/year</span> after 7-day free trial
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Cancel anytime before trial ends — no charge
        </p>
      </div>

      {isPremium && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg p-3 text-center">
          <p className="font-medium text-sm">You have Premium access</p>
        </div>
      )}

      {/* Simple Feature List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <ul className="space-y-3">
            {PRICING.annual.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <button
              onClick={handleUpgrade}
              disabled={isPremium}
              className={`px-8 py-3 font-medium rounded-lg transition-colors ${
                isPremium
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {isPremium ? 'Already Premium' : 'Start Free Trial'}
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        Activity Calendar is free forever
      </p>
    </div>
  );
}
