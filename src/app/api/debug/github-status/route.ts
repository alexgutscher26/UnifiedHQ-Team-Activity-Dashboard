import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import { getSelectedRepositoryCount } from '@/lib/integrations/github';

const prisma = new PrismaClient();

/**
 * Handles the GET request to retrieve user-related GitHub data.
 *
 * This function first checks the user's session for authentication. If the user is authenticated, it retrieves the user's GitHub connection status, selected repositories, and stored activities. It also counts the selected repositories and formats the response with relevant user data. In case of an error, it logs the error and returns a 500 status with an error message.
 *
 * @param request - The incoming NextRequest object containing the request headers.
 * @returns A JSON response containing user data, including GitHub connection status, selected repositories, and stored activities.
 * @throws Error If an error occurs during the process, a JSON response with a 500 status is returned.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get GitHub connection status
    const connection = await prisma.connection.findFirst({
      where: {
        userId,
        type: 'github',
      },
    });

    // Get selected repositories
    const selectedRepos = await prisma.selectedRepository.findMany({
      where: {
        userId,
      },
    });

    // Get stored activities
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        source: 'github',
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    // Get selected repository count
    const selectedRepoCount = await getSelectedRepositoryCount(userId);

    return NextResponse.json({
      debug: {
        userId,
        githubConnected: !!connection,
        selectedRepositories: selectedRepos.map(repo => ({
          id: repo.repoId,
          name: repo.repoName,
          owner: repo.repoOwner,
          url: repo.repoUrl,
          isPrivate: repo.isPrivate,
        })),
        selectedRepositoryCount: selectedRepoCount,
        storedActivities: activities.map(activity => ({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          timestamp: activity.timestamp,
          externalId: activity.externalId,
          metadata: activity.metadata,
        })),
        totalActivities: activities.length,
      },
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Debug failed',
      },
      { status: 500 }
    );
  }
}
