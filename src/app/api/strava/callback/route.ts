import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    logger.debug('Strava callback received', {
      hasSession: !!session,
      hasCode: !!code,
      hasState: !!state,
    });

    if (error) {
      logger.warn('Strava authorization denied by user', { error });
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=strava_denied`);
    }

    if (!session?.user?.id) {
      logger.warn('Strava callback without active session');
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_session`);
    }

    if (!code) {
      logger.warn('Strava callback missing authorization code', { userId: session.user.id });
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_code`);
    }

    if (!state) {
      logger.warn('Strava callback missing state parameter', { userId: session.user.id });
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=invalid_state`);
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error('Strava token exchange failed', undefined, {
        status: tokenResponse.status,
        userId: session.user.id,
        error: errorText,
      });
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      logger.error('Strava token response missing access_token', undefined, {
        userId: session.user.id,
        hasRefreshToken: !!tokenData.refresh_token,
        hasAthlete: !!tokenData.athlete,
      });
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_access_token`);
    }

    logger.info('Strava token exchange successful', { userId: session.user.id });

    try {
      // First try to find if this Strava account is connected to any user
      const existingStravaConnection = await prisma.account.findFirst({
        where: {
          provider: 'strava',
          providerAccountId: tokenData.athlete.id.toString(),
        },
      });

      if (existingStravaConnection && existingStravaConnection.userId !== session.user.id) {
        logger.warn('Strava account already connected to another user', {
          userId: session.user.id,
          existingUserId: existingStravaConnection.userId,
        });
        return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=already_connected`);
      }

      // Check for existing Strava account for current user
      const existingAccount = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: 'strava',
        },
      });

      const accountData = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000 + tokenData.expires_in),
        token_type: tokenData.token_type,
        scope: 'read,activity:read_all,profile:read_all',
      };

      if (existingAccount) {
        // Update existing account
        await prisma.account.update({
          where: { id: existingAccount.id },
          data: accountData,
        });
        logger.info('Updated existing Strava connection', { userId: session.user.id });
      } else {
        // Create new account
        await prisma.account.create({
          data: {
            userId: session.user.id,
            type: 'oauth',
            provider: 'strava',
            providerAccountId: tokenData.athlete.id.toString(),
            ...accountData,
          },
        });
        logger.info('Created new Strava connection', { userId: session.user.id });
      }

      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?success=connected`);
    } catch (dbError: unknown) {
      logger.error('Database error during Strava connection', dbError instanceof Error ? dbError : undefined, {
        userId: session.user.id,
      });
      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        if (dbError.code === 'P2002') {
          return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=already_connected`);
        }
      }
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=database_error`);
    }
  } catch (error) {
    logger.error('Strava connection error', error instanceof Error ? error : undefined);
    return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=connection_failed`);
  }
}
