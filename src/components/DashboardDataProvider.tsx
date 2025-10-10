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
  stravaConnected: boolean;
  isInitialized: boolean;
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
  const [isStravaConnected, setIsStravaConnected] = useState<boolean>(sessionUser?.stravaConnected ?? false);
  const [activities, setActivities] = useState<StravaActivity[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reauthRequired, setReauthRequired] = useState(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(!(sessionUser?.stravaConnected ?? false));
  const hasFetched = useRef(false);

  useEffect(() => {
    setIsStravaConnected(sessionUser?.stravaConnected ?? false);
    if (!sessionUser?.stravaConnected) {
      setIsInitialized(true);
    }
  }, [sessionUser?.stravaConnected]);

  const fetchActivities = useCallback(async () => {
    if (!userId || !isStravaConnected) {
      setActivities(null);
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    setIsInitialized(false);
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
          setIsStravaConnected(false);
          if (sessionUser && typeof update === 'function') {
            await update({
              user: {
                ...sessionUser,
                stravaConnected: false,
              },
            });
          }
        } else if (err.code === 'STRAVA_NOT_CONNECTED' || err.code === 'BAD_REQUEST' || err.status === 400) {
          setActivities(null);
          if (isStravaConnected) {
            setIsStravaConnected(false);
            if (sessionUser && typeof update === 'function') {
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
      setIsInitialized(true);
    }
  }, [userId, sessionUser, isStravaConnected, update]);

  const refetch = () => {
    fetchActivities();
  };

  useEffect(() => {
    if (!isStravaConnected) {
      hasFetched.current = false;
      setIsInitialized(true);
      return;
    }

    if (userId && isStravaConnected && !hasFetched.current) {
      hasFetched.current = true;
      fetchActivities();
    }
  }, [userId, isStravaConnected, fetchActivities]);

  const value: DashboardContextType = {
    activities,
    isLoading,
    error,
    reauthRequired,
    stravaConnected: isStravaConnected,
    isInitialized,
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
