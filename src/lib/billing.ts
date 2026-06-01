import { User } from '@prisma/client';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { polar, POLAR_CONFIG } from '@/lib/polar';

export type BillingPlan = 'annual';

export interface CheckoutUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface PolarWebhookPayload {
  type: string;
  data: {
    id: string;
    metadata?: { userId?: string; plan?: string };
    customer?: {
      externalId?: string | null;
      email?: string | null;
      metadata?: { userId?: string };
    };
    externalCustomerId?: string | null;
    productId?: string | null;
    product_id?: string | null;
    product?: { id?: string | null };
    subscription_id?: string;
    subscriptionId?: string;
    subscription?: {
      id?: string;
      current_period_end?: string;
      currentPeriodEnd?: string;
    };
    user_email?: string;
    customerEmail?: string;
    status?: string;
    current_period_end?: string;
    currentPeriodEnd?: string;
  };
}

function appUrl(): string {
  const url = process.env.NEXTAUTH_URL;

  if (!url) {
    throw new Error('NEXTAUTH_URL is required for billing flows');
  }

  return url.replace(/\/$/, '');
}

function normalizePlan(plan?: string): BillingPlan {
  return plan === 'annual' ? plan : 'annual';
}

function normalizeStatus(status?: string): string {
  if (!status) {
    return 'active';
  }

  if (status === 'canceled' || status === 'cancelled') {
    return 'canceled';
  }

  if (status === 'revoked' || status === 'expired') {
    return 'expired';
  }

  return status;
}

function parseDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function userIdFromPolarPayload(payload: PolarWebhookPayload): string | undefined {
  return payload.data.externalCustomerId ||
    payload.data.customer?.externalId ||
    payload.data.metadata?.userId ||
    payload.data.customer?.metadata?.userId ||
    undefined;
}

export function productIdFromPolarPayload(payload: PolarWebhookPayload): string | undefined {
  return payload.data.productId ||
    payload.data.product_id ||
    payload.data.product?.id ||
    undefined;
}

export function subscriptionIdFromPolarPayload(payload: PolarWebhookPayload): string {
  return payload.data.subscriptionId ||
    payload.data.subscription_id ||
    payload.data.subscription?.id ||
    payload.data.id;
}

export function currentPeriodEndFromPolarPayload(payload: PolarWebhookPayload): Date | null {
  return parseDate(
    payload.data.currentPeriodEnd ||
    payload.data.current_period_end ||
    payload.data.subscription?.currentPeriodEnd ||
    payload.data.subscription?.current_period_end
  );
}

function emailFromPolarPayload(payload: PolarWebhookPayload): string | undefined {
  return payload.data.user_email ||
    payload.data.customerEmail ||
    payload.data.customer?.email ||
    undefined;
}

function isForConfiguredProduct(payload: PolarWebhookPayload): boolean {
  const productId = productIdFromPolarPayload(payload);
  return !productId || productId === POLAR_CONFIG.productId;
}

async function findPolarUser(payload: PolarWebhookPayload): Promise<User | null> {
  const userId = userIdFromPolarPayload(payload);

  if (userId) {
    return prisma.user.findUnique({ where: { id: userId } });
  }

  const email = emailFromPolarPayload(payload);
  return email ? prisma.user.findUnique({ where: { email } }) : null;
}

export async function createBillingCheckout(user: CheckoutUser) {
  if (!polar) {
    throw new Error('Polar client is not configured');
  }

  return polar.checkouts.create({
    products: [POLAR_CONFIG.productId],
    externalCustomerId: user.id,
    customerEmail: user.email,
    customerName: user.name || user.email,
    customerMetadata: {
      userId: user.id,
    },
    metadata: {
      userId: user.id,
      plan: 'annual',
    },
    successUrl: `${appUrl()}/dashboard?checkout=success&checkout_id={CHECKOUT_ID}`,
    returnUrl: `${appUrl()}/pricing`,
    currency: 'usd',
    allowTrial: true,
  });
}

export async function createBillingPortalUrl(userId: string): Promise<string | null> {
  if (!polar) {
    return null;
  }

  const customerSession = await polar.customerSessions.create({
    externalCustomerId: userId,
    returnUrl: `${appUrl()}/pricing`,
  });

  return customerSession.customerPortalUrl || null;
}

export function fallbackBillingPortalUrl(): string {
  return `https://polar.sh/${POLAR_CONFIG.organizationId}/portal`;
}

export async function processPolarWebhook(payload: PolarWebhookPayload): Promise<void> {
  if (!isForConfiguredProduct(payload)) {
    logger.info('Ignoring Polar webhook for a different product', {
      type: payload.type,
      productId: productIdFromPolarPayload(payload),
    });
    return;
  }

  switch (payload.type) {
    case 'checkout.created':
      logger.info('Checkout created', { checkoutId: payload.data.id });
      return;

    case 'order.created': {
      const userId = userIdFromPolarPayload(payload);
      logger.info('Order created', {
        orderId: payload.data.id,
        userId,
      });

      if (!userId) {
        logger.warn('Order missing user identity', { orderId: payload.data.id });
        return;
      }

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          polarSubscriptionId: subscriptionIdFromPolarPayload(payload),
          status: 'active',
          plan: normalizePlan(payload.data.metadata?.plan),
          currentPeriodEnd: currentPeriodEndFromPolarPayload(payload),
        },
        update: {
          status: 'active',
          polarSubscriptionId: subscriptionIdFromPolarPayload(payload),
          currentPeriodEnd: currentPeriodEndFromPolarPayload(payload),
        },
      });

      logger.info('Subscription activated', { userId });
      return;
    }

    case 'subscription.created':
    case 'subscription.updated': {
      logger.info('Subscription event', {
        subscriptionId: payload.data.id,
        status: payload.data.status,
      });

      const user = await findPolarUser(payload);

      if (!user) {
        logger.warn('Subscription event missing matching user', {
          subscriptionId: payload.data.id,
          userId: userIdFromPolarPayload(payload),
          email: emailFromPolarPayload(payload),
        });
        return;
      }

      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          polarSubscriptionId: payload.data.id,
          status: normalizeStatus(payload.data.status),
          plan: normalizePlan(payload.data.metadata?.plan),
          currentPeriodEnd: currentPeriodEndFromPolarPayload(payload),
        },
        update: {
          status: normalizeStatus(payload.data.status),
          polarSubscriptionId: payload.data.id,
          currentPeriodEnd: currentPeriodEndFromPolarPayload(payload),
        },
      });

      logger.info('Subscription updated via subscription event', { userId: user.id });
      return;
    }

    case 'subscription.canceled':
      logger.info('Subscription canceled', { subscriptionId: payload.data.id });
      await prisma.subscription.updateMany({
        where: { polarSubscriptionId: payload.data.id },
        data: { status: 'canceled' },
      });
      return;

    case 'subscription.revoked':
      logger.info('Subscription revoked', { subscriptionId: payload.data.id });
      await prisma.subscription.updateMany({
        where: { polarSubscriptionId: payload.data.id },
        data: { status: 'expired' },
      });
      return;

    default:
      logger.info('Unhandled webhook event', { type: payload.type });
  }
}
