import { NextRequest, NextResponse } from 'next/server';
import { Webhook, WebhookVerificationError } from 'standardwebhooks';
import { logger } from '@/lib/logger';
import { PolarWebhookPayload, processPolarWebhook } from '@/lib/billing';

function standardWebhookSecret(secret: string): string {
  return secret.startsWith('whsec_') ? secret : Buffer.from(secret, 'utf8').toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const requestBody = await request.text();

    // Validate webhook signature if secret is configured
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    let payload: PolarWebhookPayload;

    if (webhookSecret) {
      const webhookHeaders = {
        'webhook-id': request.headers.get('webhook-id') ?? '',
        'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
        'webhook-signature': request.headers.get('webhook-signature') ?? '',
      };

      try {
        payload = new Webhook(standardWebhookSecret(webhookSecret)).verify(
          requestBody,
          webhookHeaders
        ) as PolarWebhookPayload;
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

    await processPolarWebhook(payload);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error('Error processing Polar webhook', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
