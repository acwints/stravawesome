'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { StravaActivity } from '@/types';

interface DashboardData {
  activities: StravaActivity[] | null;
  isLoading: boolean;
  error: string | null;
}

interface DashboardContextType extends DashboardData {
  refetch: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardDataProviderProps {
  children: ReactNode;
}

export function DashboardDataProvider({ children }: DashboardDataProviderProps) {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<StravaActivity[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchActivities = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/strava/activities');
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      setActivities(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const refetch = () => {
    fetchActivities();
  };

  useEffect(() => {
    if (session?.user?.id && !hasFetched.current) {
      hasFetched.current = true;
      // Add a small delay to prevent immediate concurrent calls
      const timer = setTimeout(() => {
        fetchActivities();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [session?.user?.id, fetchActivities]);

  const value: DashboardContextType = {
    activities,
    isLoading,
    error,
    refetch,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
}
