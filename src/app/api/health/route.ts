/**
 * Health check endpoint for monitoring
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        responseTime: `${responseTime}ms`,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'disconnected',
          responseTime: `${responseTime}ms`,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
