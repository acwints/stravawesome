import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/config';
import prisma from '@/lib/prisma';

// Get user's goals
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        year: 2025,
      },
    });

    return Response.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return Response.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// Create or update goals
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const goals = await request.json();
    
    // Validate goals
    if (!Array.isArray(goals)) {
      return Response.json({ error: 'Invalid goals format' }, { status: 400 });
    }

    const validActivityTypes = ['Run', 'Ride', 'Walk', 'Hike'];
    const validGoals = goals.every(goal => 
      typeof goal.targetDistance === 'number' &&
      validActivityTypes.includes(goal.activityType)
    );

    if (!validGoals) {
      return Response.json({ error: 'Invalid goal data' }, { status: 400 });
    }

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
          targetDistance: goal.targetDistance,
        },
      })
    );

    const updatedGoals = await Promise.all(upsertPromises);
    return Response.json(updatedGoals);
  } catch (error) {
    console.error('Error updating goals:', error);
    return Response.json({ error: 'Failed to update goals' }, { status: 500 });
  }
} 