import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import { getSelectedRepositoryCount } from '@/lib/integrations/github';

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
