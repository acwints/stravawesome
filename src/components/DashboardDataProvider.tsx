'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { StravaActivity } from '@/types';
import { fetchActivities as fetchActivitiesApi, ApiError } from '@/services/api';

interface DashboardData {
  activities: StravaActivity[] | null;
  isLoading: boolean;
  error: string | null;
  reauthRequired: boolean;
}

interface DashboardContextType extends DashboardData {
  refetch: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardDataProviderProps {
  children: ReactNode;
}

export function DashboardDataProvider({ children }: DashboardDataProviderProps) {
  const { data: session, update } = useSession();
  const userId = session?.user?.id ?? null;
  const sessionUser = session?.user;
  const [activities, setActivities] = useState<StravaActivity[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reauthRequired, setReauthRequired] = useState(false);
  const hasFetched = useRef(false);

  const fetchActivities = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);
    setReauthRequired(false);

    try {
      const data = await fetchActivitiesApi();
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.code === 'STRAVA_REAUTH_REQUIRED') {
          setReauthRequired(true);
          setActivities(null);
          if (sessionUser) {
            if (typeof update === 'function') {
              await update({
                user: {
                  ...sessionUser,
                  stravaConnected: false,
                },
              });
            }
          }
        }
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, sessionUser, update]);

  const refetch = () => {
    fetchActivities();
  };

  useEffect(() => {
    if (userId && !hasFetched.current) {
      hasFetched.current = true;
      // Add a small delay to prevent immediate concurrent calls
      const timer = setTimeout(() => {
        fetchActivities();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [userId, fetchActivities]);

  const value: DashboardContextType = {
    activities,
    isLoading,
    error,
    reauthRequired,
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
