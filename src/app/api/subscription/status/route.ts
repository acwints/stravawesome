import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/config';
import prisma from '@/lib/prisma';
import { checkPremiumStatus } from '@/lib/subscription';
import { logger } from '@/lib/logger';
import { successResponse, ErrorResponses, withErrorHandling } from '@/lib/api-response';

export async function GET() {
  return withErrorHandling(async () => {
    const startTime = Date.now();
    logger.apiRequest('GET', '/api/subscription/status');

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.warn('Unauthorized access attempt to subscription status');
      return ErrorResponses.unauthorized();
    }

    const status = await checkPremiumStatus(prisma, session.user.id);

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/subscription/status', 200, duration, {
      isPremium: status.isPremium,
    });

    return successResponse(status);
  });
}
