import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import { Octokit } from '@octokit/rest';

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

    // Get GitHub connection
    const connection = await prisma.connection.findFirst({
      where: {
        userId,
        type: 'github',
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: connection.accessToken,
      userAgent: 'UnifiedHQ/1.0.0',
    });

    // Get selected repositories
    const selectedRepos = await prisma.selectedRepository.findMany({
      where: {
        userId,
      },
    });

    // Get actual repository info from GitHub
    const repoInfo = [];
    for (const repo of selectedRepos) {
      try {
        const [owner, repoName] = repo.repoName.split('/');
        const { data: githubRepo } = await octokit.rest.repos.get({
          owner,
          repo: repoName,
        });

        repoInfo.push({
          stored: {
            id: repo.repoId,
            name: repo.repoName,
          },
          actual: {
            id: githubRepo.id,
            name: githubRepo.full_name,
            updated: githubRepo.updated_at,
            pushed: githubRepo.pushed_at,
          },
          match: repo.repoId === githubRepo.id,
        });
      } catch (error) {
        repoInfo.push({
          stored: {
            id: repo.repoId,
            name: repo.repoName,
          },
          actual: null,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      debug: {
        userId,
        selectedRepositories: repoInfo,
      },
    });
  } catch (error: any) {
    console.error('Repository debug error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Debug failed',
      },
      { status: 500 }
    );
  }
}
