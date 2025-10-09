/**
 * Subscription utilities for premium access control
 */

import { PrismaClient, Subscription } from '@prisma/client';
import { logger } from './logger';

export interface SubscriptionStatus {
  isPremium: boolean;
  subscription: Subscription | null;
  reason?: string;
}

/**
 * Check if a user has an active premium subscription
 */
export async function checkPremiumStatus(
  prisma: PrismaClient,
  userId: string
): Promise<SubscriptionStatus> {
  try {
    logger.dbQuery('findUnique', 'Subscription', { userId });

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return {
        isPremium: false,
        subscription: null,
        reason: 'No subscription found',
      };
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return {
        isPremium: false,
        subscription,
        reason: `Subscription status: ${subscription.status}`,
      };
    }

    // Check if subscription has expired
    if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()) {
      return {
        isPremium: false,
        subscription,
        reason: 'Subscription expired',
      };
    }

    return {
      isPremium: true,
      subscription,
    };
  } catch (error) {
    logger.error('Error checking premium status', error, { userId });
    return {
      isPremium: false,
      subscription: null,
      reason: 'Error checking subscription',
    };
  }
}

/**
 * Features that require premium access
 */
export const PREMIUM_FEATURES = {
  GOALS: 'goals',
  WEEKLY_CHART: 'weekly_chart',
  ACTIVITIES_LIST: 'activities_list',
  TRAINING_MAP: 'training_map',
  PHOTO_GALLERY: 'photo_gallery',
  AI_CHAT: 'ai_chat',
} as const;

/**
 * Features that are always free
 */
export const FREE_FEATURES = {
  ACTIVITY_HEATMAP: 'activity_heatmap',
} as const;

/**
 * Check if a specific feature requires premium access
 */
export function isPremiumFeature(feature: string): boolean {
  return Object.values(PREMIUM_FEATURES).includes(feature as (typeof PREMIUM_FEATURES)[keyof typeof PREMIUM_FEATURES]);
}

/**
 * Get the pricing information
 */
export const PRICING = {
  annual: {
    price: 12,
    currency: 'USD',
    interval: 'year',
    features: [
      'Unlimited activity tracking',
      'Training insights & analytics',
      'Interactive route maps',
      'Photo gallery from activities',
      'AI-powered training coach',
      'Goal setting & tracking',
    ],
  },
};
