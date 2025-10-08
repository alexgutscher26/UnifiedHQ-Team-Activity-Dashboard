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

/**
 * Retrieves the GitHub connection status for the authenticated user.
 *
 * This function first obtains the session using Better Auth. If the session is not found, it throws an authentication error.
 * It then checks if the user has a connected GitHub account by querying the database.
 * Depending on the presence of the account and its access token, it returns the connection status along with user details if connected.
 *
 * @param request - The NextRequest object containing the request headers for session retrieval.
 */
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
