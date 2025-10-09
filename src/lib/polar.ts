/**
 * Polar.sh client configuration
 */

import { Polar } from '@polar-sh/sdk';

// Polar configuration
export const POLAR_CONFIG = {
  organizationId: process.env.POLAR_ORGANIZATION_ID || '',
  productId: process.env.POLAR_PRODUCT_ID || '',
  priceId: process.env.POLAR_PRICE_ID || '',
};

// Initialize Polar client only if access token is available
let polarClient: Polar | null = null;

if (process.env.POLAR_ACCESS_TOKEN) {
  polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
  });
} else if (process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  POLAR_ACCESS_TOKEN not set. Polar.sh features will be disabled.');
}

export const polar = polarClient;

// Validate configuration in runtime (not build time)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  if (!POLAR_CONFIG.organizationId || !POLAR_CONFIG.productId || !POLAR_CONFIG.priceId) {
    console.warn('⚠️  Polar.sh not fully configured. Some features may not work.');
  }
}
