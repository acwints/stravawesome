'use client';

import useSWR from 'swr';
import { SubscriptionStatus } from '@/lib/subscription';

const fetcher = async (url: string): Promise<SubscriptionStatus> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch subscription status');
  }
  const json = await response.json();
  return json.data;
};

export function useSubscription() {
  const { data, error, mutate } = useSWR<SubscriptionStatus>(
    '/api/subscription/status',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    isPremium: true, // All features now available to all users
    subscription: data?.subscription ?? null,
    isLoading: false, // No loading state needed
    error,
    refresh: mutate,
  };
}
