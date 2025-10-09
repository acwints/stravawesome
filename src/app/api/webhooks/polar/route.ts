import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    logger.info('Polar webhook received', { type: payload.type });

    // Handle different webhook events
    switch (payload.type) {
      case 'checkout.created':
        logger.info('Checkout created', { checkoutId: payload.data.id });
        break;

      case 'order.created':
        // When a subscription is purchased
        logger.info('Order created', {
          orderId: payload.data.id,
          userId: payload.data.metadata?.userId,
        });

        if (payload.data.metadata?.userId) {
          // Create or update subscription
          await prisma.subscription.upsert({
            where: { userId: payload.data.metadata.userId },
            create: {
              userId: payload.data.metadata.userId,
              polarSubscriptionId: payload.data.subscription_id || payload.data.id,
              status: 'active',
              plan: 'annual',
              currentPeriodEnd: payload.data.subscription?.current_period_end
                ? new Date(payload.data.subscription.current_period_end)
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            },
            update: {
              status: 'active',
              polarSubscriptionId: payload.data.subscription_id || payload.data.id,
              currentPeriodEnd: payload.data.subscription?.current_period_end
                ? new Date(payload.data.subscription.current_period_end)
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          });

          logger.info('Subscription activated', {
            userId: payload.data.metadata.userId,
          });
        }
        break;

      case 'subscription.created':
      case 'subscription.updated':
        logger.info('Subscription event', {
          subscriptionId: payload.data.id,
          status: payload.data.status,
        });

        // Find user by email from subscription
        const user = await prisma.user.findUnique({
          where: { email: payload.data.user_email },
        });

        if (user) {
          await prisma.subscription.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              polarSubscriptionId: payload.data.id,
              status: payload.data.status,
              plan: 'annual',
              currentPeriodEnd: payload.data.current_period_end
                ? new Date(payload.data.current_period_end)
                : null,
            },
            update: {
              status: payload.data.status,
              currentPeriodEnd: payload.data.current_period_end
                ? new Date(payload.data.current_period_end)
                : null,
            },
          });

          logger.info('Subscription updated via subscription event', { userId: user.id });
        }
        break;

      case 'subscription.canceled':
        logger.info('Subscription canceled', { subscriptionId: payload.data.id });

        await prisma.subscription.updateMany({
          where: { polarSubscriptionId: payload.data.id },
          data: { status: 'canceled' },
        });
        break;

      case 'subscription.revoked':
        logger.info('Subscription revoked', { subscriptionId: payload.data.id });

        await prisma.subscription.updateMany({
          where: { polarSubscriptionId: payload.data.id },
          data: { status: 'expired' },
        });
        break;

      default:
        logger.info('Unhandled webhook event', { type: payload.type });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error('Error processing Polar webhook', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
