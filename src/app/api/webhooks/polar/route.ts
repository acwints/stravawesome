import { NextRequest, NextResponse } from 'next/server';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Webhook payload types for type safety
interface WebhookPayload {
  type: string;
  data: {
    id: string;
    metadata?: { userId?: string };
    subscription_id?: string;
    subscription?: { current_period_end?: string };
    user_email?: string;
    status?: string;
    current_period_end?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const requestBody = await request.text();

    // Validate webhook signature if secret is configured
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    let payload: WebhookPayload;

    if (webhookSecret) {
      const webhookHeaders = {
        'webhook-id': request.headers.get('webhook-id') ?? '',
        'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
        'webhook-signature': request.headers.get('webhook-signature') ?? '',
      };

      try {
        payload = validateEvent(requestBody, webhookHeaders, webhookSecret) as WebhookPayload;
      } catch (error) {
        if (error instanceof WebhookVerificationError) {
          logger.warn('Webhook signature verification failed', {
            error: error.message,
          });
          return NextResponse.json(
            { error: 'Invalid webhook signature' },
            { status: 403 }
          );
        }
        throw error;
      }
    } else {
      // In development without secret, parse JSON directly but log warning
      if (process.env.NODE_ENV === 'production') {
        logger.error('POLAR_WEBHOOK_SECRET not configured in production');
        return NextResponse.json(
          { error: 'Webhook secret not configured' },
          { status: 500 }
        );
      }
      logger.warn('Webhook signature validation skipped - POLAR_WEBHOOK_SECRET not set');
      payload = JSON.parse(requestBody);
    }

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
        if (payload.data.user_email) {
          const user = await prisma.user.findUnique({
            where: { email: payload.data.user_email },
          });

          if (user) {
            await prisma.subscription.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                polarSubscriptionId: payload.data.id,
                status: payload.data.status || 'active',
                plan: 'annual',
                currentPeriodEnd: payload.data.current_period_end
                  ? new Date(payload.data.current_period_end)
                  : null,
              },
              update: {
                status: payload.data.status || 'active',
                currentPeriodEnd: payload.data.current_period_end
                  ? new Date(payload.data.current_period_end)
                  : null,
              },
            });

            logger.info('Subscription updated via subscription event', { userId: user.id });
          }
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
