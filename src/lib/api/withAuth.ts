import { NextRequest, NextResponse } from 'next/server';
import { getPrismaWithAuth } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type RouteHandler = (
  req: NextRequest,
  context: { params: any },
  prisma: Awaited<ReturnType<typeof getPrismaWithAuth>>
) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, context: { params: any }) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    const prisma = await getPrismaWithAuth();
    
    try {
      return await handler(req, context, prisma);
    } catch (error) {
      console.error('API Error:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500 }
      );
    }
  };
} 