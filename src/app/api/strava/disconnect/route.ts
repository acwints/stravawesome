import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StravaClient } from '@/lib/strava-client';
import { logger } from '@/lib/logger';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const stravaClient = new StravaClient(prisma);

  await stravaClient.disconnectUserAccount(session.user.id);

  logger.info('Strava account disconnected on demand', { userId: session.user.id });

  return NextResponse.json({ success: true });
}
