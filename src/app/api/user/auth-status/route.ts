import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import {
  withErrorHandling,
  createApiSuccessResponse,
  ApiErrors,
} from '@/lib/api-error-handler';

const prisma = new PrismaClient();

/**
 * Retrieve the authentication status of a user based on the request.
 *
 * This function first obtains the session from Better Auth using the request headers.
 * If the session is valid, it fetches the user and their associated accounts from the database.
 * It then checks for the presence of a GitHub account and determines the user's signup method.
 * Finally, it checks if the GitHub account is connected and has an access token before returning the authentication status.
 *
 * @param request - The NextRequest object containing the request headers.
 * @returns An object containing the user's authentication status, including signup method and GitHub connection status.
 * @throws ApiErrors.authentication If authentication is required and no session is found.
 * @throws ApiErrors.notFound If the user is not found in the database.
 */
async function getUserAuthStatus(request: NextRequest) {
  // Get the session from Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw ApiErrors.authentication('Authentication required');
  }

  // Get user with their accounts
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: true,
    },
  });

  if (!user) {
    throw ApiErrors.notFound('User not found');
  }

  // Check if user has GitHub account connected
  const githubAccount = user.accounts.find(
    account => account.providerId === 'github'
  );

  // Determine signup method
  const hasEmailPassword = user.accounts.some(
    account => account.providerId === 'credential' && account.password
  );
  const hasGitHub = !!githubAccount;

  let signupMethod: 'github' | 'email' | 'unknown' = 'unknown';
  if (hasGitHub && !hasEmailPassword) {
    signupMethod = 'github';
  } else if (hasEmailPassword) {
    signupMethod = 'email';
  }

  // Check if GitHub is connected and has access token
  const isGitHubConnected = !!(githubAccount && githubAccount.accessToken);

  return createApiSuccessResponse(
    {
      signupMethod,
      isGitHubConnected,
      lastLoginMethod: user.lastLoginMethod,
      hasEmailPassword,
      hasGitHub,
      githubAccount: isGitHubConnected
        ? {
            id: githubAccount.id,
            accountId: githubAccount.accountId,
            providerId: githubAccount.providerId,
            createdAt: githubAccount.createdAt,
          }
        : null,
    },
    'User authentication status retrieved'
  );
}

export const GET = withErrorHandling(getUserAuthStatus);
