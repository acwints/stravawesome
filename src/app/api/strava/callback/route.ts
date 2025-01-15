import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('Session:', session);
    console.log('Code:', code);
    console.log('State:', state);

    if (error) {
      console.error('Strava authorization error:', error);
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=strava_denied`);
    }

    if (!session?.user?.id) {
      console.error('No session or user ID found');
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_session`);
    }

    if (!code) {
      console.error('No authorization code found');
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_code`);
    }

    if (!state) {
      console.error('No state parameter found');
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
      console.error('Token exchange failed:', await tokenResponse.text());
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token data:', tokenData);

    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData);
      return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_access_token`);
    }

    // Check for existing Strava account
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'strava',
      },
    });

    if (existingAccount) {
      // Update existing account
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Math.floor(Date.now() / 1000 + tokenData.expires_in),
          token_type: tokenData.token_type,
          scope: 'read,activity:read_all,profile:read_all',
        },
      });
    } else {
      // Create new account
      await prisma.account.create({
        data: {
          userId: session.user.id,
          type: 'oauth',
          provider: 'strava',
          providerAccountId: tokenData.athlete.id.toString(),
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Math.floor(Date.now() / 1000 + tokenData.expires_in),
          token_type: tokenData.token_type,
          scope: 'read,activity:read_all,profile:read_all',
        },
      });
    }

    return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?success=connected`);
  } catch (error) {
    console.error('Strava connection error:', error);
    return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=connection_failed`);
  }
} 