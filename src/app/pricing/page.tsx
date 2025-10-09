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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Unlock Your Full Training Potential
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Get unlimited access to all premium features for just $12/year
          </p>
        </div>

        {/* Current Status Banner */}
        {isPremium && (
          <div className="mb-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-2xl font-bold">You&apos;re Premium!</h3>
            </div>
            <p className="text-green-100">You have full access to all features</p>
          </div>
        )}

        {/* Pricing Card */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Tier */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Free</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">$0</span>
                <span className="text-gray-500 dark:text-gray-400">/forever</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Activity Calendar (GitHub-style heatmap)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400 dark:text-gray-500">Limited features</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold rounded-lg cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Premium Tier */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
              Popular
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold">$12</span>
                <span className="text-primary-100">/year</span>
              </div>
              <p className="text-primary-100">That&apos;s just $1/month!</p>
            </div>

            <ul className="space-y-3 mb-8">
              {PRICING.annual.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={isPremium}
              className={`w-full px-6 py-3 font-semibold rounded-lg transition-all duration-200 transform ${
                isPremium
                  ? 'bg-white/20 text-white cursor-not-allowed'
                  : 'bg-white text-primary-600 hover:bg-gray-50 hover:scale-105 shadow-lg'
              }`}
            >
              {isPremium ? 'Active Subscription' : 'Upgrade to Premium'}
            </button>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Feature Comparison
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Free</th>
                  <th className="text-center py-3 px-4 font-semibold text-primary-600 dark:text-primary-400">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Activity Calendar</td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Weekly Activity Chart</td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Interactive Route Maps</td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Photo Gallery</td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">AI Training Coach</td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Goal Setting & Tracking</td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="text-center py-3 px-4">
                    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Have questions? Contact us at{' '}
            <a href="mailto:support@stravawesome.com" className="text-primary-600 dark:text-primary-400 hover:underline">
              support@stravawesome.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
