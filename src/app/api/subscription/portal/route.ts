import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/config';
import { polar, POLAR_CONFIG } from '@/lib/polar';
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
    if (polar && POLAR_CONFIG.organizationId) {
      try {
        // Create a customer session for pre-authenticated portal access
        const customerSession = await polar.customerSessions.create({
          customerId: subscription.polarSubscriptionId,
        });

        if (customerSession.customerPortalUrl) {
          const duration = Date.now() - startTime;
          logger.apiResponse('GET', '/api/subscription/portal', 302, duration);
          return NextResponse.redirect(customerSession.customerPortalUrl);
        }
      } catch (error) {
        // If SDK method fails, fall back to direct portal URL
        logger.warn('Failed to create customer session, using fallback', error);
      }
    }

    // Fallback: Direct portal URL (user will need to enter email)
    const portalUrl = `https://polar.sh/${POLAR_CONFIG.organizationId}/portal`;

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/subscription/portal', 302, duration);

    return NextResponse.redirect(portalUrl);
  });
}
