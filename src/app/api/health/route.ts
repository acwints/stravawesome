/**
 * Health check endpoint for monitoring
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'pass' | 'fail';
  responseTime?: string;
  error?: string;
}

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, HealthCheck> = {};
  let healthy = true;

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'pass',
      responseTime: `${Date.now() - dbStart}ms`,
    };
  } catch (error) {
    healthy = false;
    checks.database = {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check that required env vars are present (without exposing values)
  const requiredEnvVars = ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'STRAVA_CLIENT_ID'];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingEnvVars.length > 0) {
    healthy = false;
    checks.config = {
      status: 'fail',
      error: `Missing environment variables: ${missingEnvVars.join(', ')}`,
    };
  } else {
    checks.config = { status: 'pass' };
  }

  // Check Strava API reachability
  try {
    const stravaStart = Date.now();
    const stravaResponse = await fetch('https://www.strava.com/api/v3/', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    checks.strava = {
      status: stravaResponse.status < 500 ? 'pass' : 'fail',
      responseTime: `${Date.now() - stravaStart}ms`,
    };
    if (stravaResponse.status >= 500) {
      healthy = false;
    }
  } catch {
    checks.strava = {
      status: 'fail',
      error: 'Strava API unreachable',
    };
    // Don't mark overall health as failed for external dependency;
    // the app can still serve cached data.
  }

  const responseTime = Date.now() - startTime;

  const payload = {
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    checks,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
  };

  return NextResponse.json(payload, { status: healthy ? 200 : 503 });
}
