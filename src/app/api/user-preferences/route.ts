import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import {
  withErrorHandling,
  createApiSuccessResponse,
  validateRequestBody,
  ApiErrors,
} from '@/lib/api-error-handler';
import { commonSchemas } from '@/lib/api-validation';

const prisma = new PrismaClient();

// GET - Load user preferences
/**
 * Retrieves user preferences based on the authenticated session.
 *
 * This function first attempts to get the user's session from the request headers.
 * If the session is not found, it throws an authentication error. Upon successful
 * authentication, it fetches the user's preferences from the database using their
 * user ID. If no preferences are found, it returns a default preferences object.
 *
 * @param request - The NextRequest object containing the request headers.
 */
async function getUserPreferences(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw ApiErrors.authentication('Authentication required');
  }

  const preferences = await prisma.userPreferences.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  return createApiSuccessResponse(
    preferences || {
      githubOwner: null,
      githubRepo: null,
      githubRepoId: null,
    },
    'User preferences loaded successfully'
  );
}

// POST/PUT - Save user preferences
/**
 * Saves user preferences to the database.
 *
 * This function retrieves the user's session from the request headers and validates the request body against a predefined schema.
 * If the session is valid, it performs an upsert operation on the user preferences in the database, updating existing preferences or creating new ones as necessary.
 * Finally, it returns a success response with the saved preferences.
 *
 * @param request - The NextRequest object containing the request headers and body.
 */
async function saveUserPreferences(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw ApiErrors.authentication('Authentication required');
  }

  const body = validateRequestBody(
    commonSchemas.userPreferences,
    await request.json()
  );
  const { githubOwner, githubRepo, githubRepoId } = body;

  // Upsert user preferences
  const preferences = await prisma.userPreferences.upsert({
    where: {
      userId: session.user.id,
    },
    update: {
      githubOwner,
      githubRepo,
      githubRepoId,
      updatedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      githubOwner,
      githubRepo,
      githubRepoId,
    },
  });

  return createApiSuccessResponse(
    preferences,
    'User preferences saved successfully'
  );
}

// DELETE - Clear user preferences
/**
 * Clears the user preferences for the authenticated user.
 *
 * This function retrieves the user's session from the request headers. If the session is not found, it throws an authentication error.
 * Upon successful authentication, it deletes all user preferences associated with the user's ID and returns a success response indicating that the preferences have been cleared.
 *
 * @param request - The NextRequest object containing the request headers for session retrieval.
 */
async function clearUserPreferences(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw ApiErrors.authentication('Authentication required');
  }

  await prisma.userPreferences.deleteMany({
    where: {
      userId: session.user.id,
    },
  });

  return createApiSuccessResponse(
    { cleared: true },
    'User preferences cleared successfully'
  );
}

// Export handlers with error handling
export const GET = withErrorHandling(getUserPreferences);
export const POST = withErrorHandling(saveUserPreferences);
export const DELETE = withErrorHandling(clearUserPreferences);
