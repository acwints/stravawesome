/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis or a dedicated rate limiting service
 */

import { logger } from './logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.requests.entries()) {
        if (entry.resetTime < now) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier for the requester (e.g., IP address, user ID)
   * @param config - Rate limit configuration
   * @returns true if request should be allowed, false if rate limited
   */
  check(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || entry.resetTime < now) {
      // No entry or expired entry - create new one
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (entry.count < config.maxRequests) {
      // Under limit - increment and allow
      entry.count++;
      return true;
    }

    // Rate limited
    logger.warn('Rate limit exceeded', {
      identifier,
      count: entry.count,
      maxRequests: config.maxRequests,
      resetTime: new Date(entry.resetTime).toISOString(),
    });
    return false;
  }

  /**
   * Get rate limit info for an identifier
   */
  getInfo(identifier: string, config: RateLimitConfig): {
    limit: number;
    remaining: number;
    reset: number;
  } {
    const entry = this.requests.get(identifier);
    const now = Date.now();

    if (!entry || entry.resetTime < now) {
      return {
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: now + config.windowMs,
      };
    }

    return {
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      reset: entry.resetTime,
    };
  }

  /**
   * Clear rate limit for an identifier
   */
  clear(identifier: string): void {
    this.requests.delete(identifier);
  }

  cleanup(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Common rate limit configurations
 */
export const RateLimits = {
  // Strict limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // Standard limit for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  // Generous limit for data fetching
  data: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // Strict limit for AI/expensive operations
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
};

/**
 * Helper to get client identifier from request
 */
export function getClientIdentifier(headers: { get(name: string): string | null }, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from various headers
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');

  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }

  if (realIp) {
    return `ip:${realIp}`;
  }

  return 'ip:unknown';
}
