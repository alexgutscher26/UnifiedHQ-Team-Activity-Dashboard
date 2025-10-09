import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import {
  getGithubActivities,
  isGithubConnected,
  getSelectedRepositoryCount,
} from '@/lib/integrations/github';

const prisma = new PrismaClient();

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
    const githubConnected = await isGithubConnected(userId);

    // Get selected repository count
    const selectedRepoCount = await getSelectedRepositoryCount(userId);

    // Get stored activities
    const storedActivities = await prisma.activity.findMany({
      where: {
        userId,
        source: 'github',
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    // Get GitHub activities using the same function as the API
    const githubActivities = await getGithubActivities(userId, 5);

    // Get connections
    const connections = await prisma.connection.findMany({
      where: {
        userId,
      },
    });

    // Get selected repositories
    const selectedRepos = await prisma.selectedRepository.findMany({
      where: {
        userId,
      },
    });

    return NextResponse.json({
      debug: {
        userId,
        githubConnected,
        selectedRepositoryCount: selectedRepoCount,
        connections: connections.map(conn => ({
          type: conn.type,
          hasAccessToken: !!conn.accessToken,
          expiresAt: conn.expiresAt,
        })),
        selectedRepositories: selectedRepos.map(repo => ({
          id: repo.repoId,
          name: repo.repoName,
          owner: repo.repoOwner,
          url: repo.repoUrl,
          isPrivate: repo.isPrivate,
        })),
        storedActivitiesCount: storedActivities.length,
        storedActivities: storedActivities.map(activity => ({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          timestamp: activity.timestamp,
          externalId: activity.externalId,
        })),
        githubActivitiesCount: githubActivities.length,
        githubActivities: githubActivities.map(activity => ({
          id: activity.externalId,
          title: activity.title,
          description: activity.description,
          timestamp: activity.timestamp,
          source: activity.source,
        })),
      },
    });
  } catch (error: any) {
    console.error('Activity debug error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Debug failed',
      },
      { status: 500 }
    );
  }
}
