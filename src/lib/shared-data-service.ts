/**
 * Shared Data Service
 * Prevents duplicate API calls across components by sharing cached data
 */

import { StravaActivity } from '@/types';
import { logger } from './logger';

interface SharedDataCache {
  activities: {
    data: StravaActivity[];
    timestamp: number;
    ttl: number;
  };
  lastFetch: {
    userId: string;
    timestamp: number;
  };
}

class SharedDataService {
  private cache: Map<string, SharedDataCache> = new Map();
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Get cached activities for a user
   */
  getActivities(userId: string): StravaActivity[] | null {
    const userCache = this.cache.get(userId);
    if (!userCache) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - userCache.activities.timestamp > userCache.activities.ttl;

    if (isExpired) {
      logger.debug('Shared activities cache expired', { userId });
      return null;
    }

    logger.debug('Serving shared activities cache', { 
      userId, 
      count: userCache.activities.data.length,
      age: now - userCache.activities.timestamp
    });

    return userCache.activities.data;
  }

  /**
   * Set cached activities for a user
   */
  setActivities(userId: string, activities: StravaActivity[], ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    
    this.cache.set(userId, {
      activities: {
        data: activities,
        timestamp: now,
        ttl
      },
      lastFetch: {
        userId,
        timestamp: now
      }
    });

    logger.debug('Cached shared activities', { 
      userId, 
      count: activities.length,
      ttl: ttl / 1000
    });
  }

  /**
   * Check if we should fetch fresh data (avoid duplicate calls)
   */
  shouldFetch(userId: string, maxAge: number = 5 * 60 * 1000): boolean {
    const userCache = this.cache.get(userId);
    if (!userCache) {
      return true;
    }

    const now = Date.now();
    const age = now - userCache.lastFetch.timestamp;
    
    return age > maxAge;
  }

  /**
   * Mark that a fetch is in progress to prevent duplicate calls
   */
  markFetchInProgress(userId: string): void {
    const userCache = this.cache.get(userId);
    if (userCache) {
      userCache.lastFetch.timestamp = Date.now();
    }
  }

  /**
   * Clear cache for a user
   */
  clearUser(userId: string): void {
    this.cache.delete(userId);
    logger.debug('Cleared shared cache for user', { userId });
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    logger.debug('Cleared all shared cache');
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    const stats = {
      totalUsers: this.cache.size,
      users: Array.from(this.cache.entries()).map(([userId, cache]) => ({
        userId,
        activitiesCount: cache.activities.data.length,
        age: now - cache.activities.timestamp,
        isExpired: now - cache.activities.timestamp > cache.activities.ttl
      }))
    };

    return stats;
  }
}

export const sharedDataService = new SharedDataService();
