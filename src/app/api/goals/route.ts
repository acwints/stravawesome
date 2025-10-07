import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/config';
import prisma from '@/lib/prisma';
import { ACTIVITY_TYPES } from '@/constants';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling } from '@/lib/api-response';

// Get user's goals
export async function GET() {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('GET', '/api/goals');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.warn('Unauthorized access attempt to goals');
      return ErrorResponses.unauthorized();
    }

    logger.dbQuery('findMany', 'Goal', { userId: session.user.id, year: 2025 });

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        year: 2025,
      },
    });

    // If no goals exist, return default goals
    if (goals.length === 0) {
      logger.info('No goals found, returning defaults', { userId: session.user.id });
      const defaultGoals = ACTIVITY_TYPES.map(({ type }) => ({
        userId: session.user.id,
        year: 2025,
        activityType: type,
        targetDistance: 50,
      }));

      const duration = Date.now() - startTime;
      logger.apiResponse('GET', '/api/goals', 200, duration, { goalsCount: defaultGoals.length });

      return successResponse(defaultGoals);
    }

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/goals', 200, duration, { goalsCount: goals.length });

    return successResponse(goals);
  });
}

// Create or update goals
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('POST', '/api/goals');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.warn('Unauthorized access attempt to update goals');
      return ErrorResponses.unauthorized();
    }

    const goals = await request.json();

    // Validate goals
    if (!Array.isArray(goals)) {
      logger.warn('Invalid goals format - not an array', { userId: session.user.id });
      return ErrorResponses.badRequest('Goals must be an array');
    }

    const validActivityTypes = ACTIVITY_TYPES.map(t => t.type);
    const validGoals = goals.every(goal =>
      typeof goal.targetDistance === 'number' &&
      validActivityTypes.includes(goal.activityType)
    );

    if (!validGoals) {
      logger.warn('Invalid goal data', { userId: session.user.id, goals });
      return ErrorResponses.badRequest('Invalid goal data. Each goal must have a valid activityType and targetDistance.');
    }

    logger.dbQuery('upsert', 'Goal', { userId: session.user.id, count: goals.length });

    // Upsert each goal
    const upsertPromises = goals.map(goal =>
      prisma.goal.upsert({
        where: {
          userId_year_activityType: {
            userId: session.user.id,
            year: 2025,
            activityType: goal.activityType,
          },
        },
        update: {
          targetDistance: goal.targetDistance,
        },
        create: {
          userId: session.user.id,
          year: 2025,
          activityType: goal.activityType,
          targetDistance: goal.targetDistance || 50,
        },
      })
    );

    const updatedGoals = await Promise.all(upsertPromises);

    const duration = Date.now() - startTime;
    logger.apiResponse('POST', '/api/goals', 200, duration, { goalsCount: updatedGoals.length });

    return successResponse(updatedGoals, 'Goals updated successfully');
  });
} 