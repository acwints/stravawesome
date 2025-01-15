import { NextRequest } from 'next/server';
import { generateOAuthState } from '@/utils/oauth';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.STRAVA_CLIENT_ID) {
      return Response.json({ error: 'Missing Strava client ID' }, { status: 500 });
    }

    const state = generateOAuthState();
    const baseUrl = 'https://www.strava.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      response_type: 'code',
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/strava/callback`,
      scope: 'activity:read_all,profile:read_all',
      state,
    });

    return Response.json({
      url: `${baseUrl}?${params.toString()}`,
      state,
    });
  } catch (error) {
    console.error('Error generating Strava auth URL:', error);
    return Response.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
} 