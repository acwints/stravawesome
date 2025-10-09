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
  const { data, error, isLoading, mutate } = useSWR<SubscriptionStatus>(
    '/api/subscription/status',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    isPremium: data?.isPremium ?? false,
    subscription: data?.subscription ?? null,
    isLoading,
    error,
    refresh: mutate,
  };
}
