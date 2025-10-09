/**
 * Polar.sh client configuration
 */

import { Polar } from '@polar-sh/sdk';

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error('POLAR_ACCESS_TOKEN is not set');
}

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
});

// Polar configuration
export const POLAR_CONFIG = {
  organizationId: process.env.POLAR_ORGANIZATION_ID || '',
  productId: process.env.POLAR_PRODUCT_ID || '',
  priceId: process.env.POLAR_PRICE_ID || '',
};

// Validate configuration
if (!POLAR_CONFIG.organizationId || !POLAR_CONFIG.productId || !POLAR_CONFIG.priceId) {
  console.warn('⚠️  Polar.sh not fully configured. Run: npx tsx scripts/setup-polar.ts');
}
