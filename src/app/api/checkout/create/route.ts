import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import { POLAR_CONFIG } from '@/lib/polar';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling } from '@/lib/api-response';

export async function POST() {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('POST', '/api/checkout/create');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      logger.warn('Unauthorized checkout attempt');
      return ErrorResponses.unauthorized();
    }

    // Check if Polar is configured
    if (!POLAR_CONFIG.priceId) {
      logger.error('Polar.sh not configured');
      return ErrorResponses.internalError('Payment system not configured. Please contact support.');
    }

    try {
      // Create Polar checkout URL with query parameters
      const checkoutUrl = new URL('https://polar.sh/checkout');
      checkoutUrl.searchParams.set('price', POLAR_CONFIG.priceId);
      checkoutUrl.searchParams.set('email', session.user.email);
      checkoutUrl.searchParams.set('success_url', `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`);

      // Add metadata via custom fields if needed
      checkoutUrl.searchParams.set('metadata[userId]', session.user.id);

      const duration = Date.now() - startTime;
      logger.apiResponse('POST', '/api/checkout/create', 200, duration);

      return successResponse({ url: checkoutUrl.toString() });
    } catch (error) {
      logger.error('Error creating checkout URL', error);
      return ErrorResponses.internalError('Failed to create checkout session');
    }
  });
}
