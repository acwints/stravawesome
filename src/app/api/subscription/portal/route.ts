import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/config';
import { isPolarConfigured } from '@/lib/polar';
import { createBillingPortalUrl, fallbackBillingPortalUrl } from '@/lib/billing';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ErrorResponses, withErrorHandling } from '@/lib/api-response';

export async function GET() {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('GET', '/api/subscription/portal');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      logger.warn('Unauthorized portal access attempt');
      return ErrorResponses.unauthorized();
    }

    // Check if user has a subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription?.polarSubscriptionId) {
      logger.warn('No subscription found for portal access', { userId: session.user.id });
      return ErrorResponses.badRequest('No active subscription found');
    }

    // If Polar SDK is configured, try to create a pre-authenticated session
    if (isPolarConfigured()) {
      try {
        const customerPortalUrl = await createBillingPortalUrl(session.user.id);

        if (customerPortalUrl) {
          const duration = Date.now() - startTime;
          logger.apiResponse('GET', '/api/subscription/portal', 302, duration);
          return NextResponse.redirect(customerPortalUrl);
        }
      } catch (error) {
        // If SDK method fails, fall back to direct portal URL
        const errorContext = error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error;
        logger.warn('Failed to create customer session, using fallback', { error: errorContext });
      }
    }

    // Fallback: Direct portal URL (user will need to enter email)
    const portalUrl = fallbackBillingPortalUrl();

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/subscription/portal', 302, duration);

    return NextResponse.redirect(portalUrl);
  });
}
