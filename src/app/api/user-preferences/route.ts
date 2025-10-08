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
