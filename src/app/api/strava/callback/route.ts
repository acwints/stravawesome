import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!session?.user?.id || !code) {
    return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=unauthorized`);
  }

  try {
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

    const tokenData = await tokenResponse.json();

    // Save Strava account info
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
        scope: 'activity:read_all,profile:read_all',
      },
    });

    return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?success=connected`);
  } catch (error) {
    console.error('Strava connection error:', error);
    return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=failed`);
  }
} 