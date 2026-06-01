import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import { isPolarConfigured } from '@/lib/polar';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling } from '@/lib/api-response';
import { createBillingCheckout } from '@/lib/billing';

export async function POST() {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('POST', '/api/checkout/create');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      logger.warn('Unauthorized checkout attempt');
      return ErrorResponses.unauthorized();
    }

    if (!isPolarConfigured()) {
      logger.error('Polar.sh not configured');
      return ErrorResponses.internalError('Payment system not configured. Please contact support.');
    }

    try {
      const checkout = await createBillingCheckout({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      });

      if (!checkout.id || !checkout.url) {
        logger.error('Polar checkout response missing id or url', undefined, {
          userId: session.user.id,
          hasId: Boolean(checkout.id),
          hasUrl: Boolean(checkout.url),
        });
        return ErrorResponses.internalError('Failed to create checkout session');
      }

      const duration = Date.now() - startTime;
      logger.apiResponse('POST', '/api/checkout/create', 200, duration, {
        checkoutId: checkout.id,
      });

      return successResponse({
        url: checkout.url,
        checkoutId: checkout.id,
        expiresAt: checkout.expiresAt?.toISOString?.() || checkout.expiresAt || null,
      });
    } catch (error) {
      logger.error('Error creating checkout URL', error);
      return ErrorResponses.internalError('Failed to create checkout session');
    }
  });
}
