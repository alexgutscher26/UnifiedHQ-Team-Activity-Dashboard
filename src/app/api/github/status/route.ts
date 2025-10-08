import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import {
  withErrorHandling,
  createApiSuccessResponse,
  ApiErrors,
  logApiError,
} from '@/lib/api-error-handler';

const prisma = new PrismaClient();

async function getGitHubStatus(request: NextRequest) {
  // Get the session from Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw ApiErrors.authentication('Authentication required');
  }

  // Check if the user has a GitHub account connected
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: 'github',
    },
  });

  if (!account || !account.accessToken) {
    return createApiSuccessResponse(
      {
        connected: false,
        user: null,
      },
      'GitHub account not connected'
    );
  }

  return createApiSuccessResponse(
    {
      connected: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    },
    'GitHub account connected'
  );
}

export const GET = withErrorHandling(getGitHubStatus);
