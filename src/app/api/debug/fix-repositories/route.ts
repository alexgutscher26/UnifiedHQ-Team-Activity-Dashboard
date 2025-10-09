import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import { Octokit } from '@octokit/rest';

const prisma = new PrismaClient();

/**
 * Handles the POST request to check and fix repository IDs for a user.
 *
 * This function retrieves the user's session and checks for a connected GitHub account.
 * It then fetches the selected repositories from the database and verifies their IDs against
 * the actual data from GitHub. If discrepancies are found, it updates the repository IDs
 * in the database and collects the results of the fixes. In case of errors, it logs the
 * error and returns an appropriate response.
 *
 * @param request - The incoming NextRequest object containing the request data.
 * @returns A JSON response indicating the status of the repository ID checks and fixes.
 * @throws Error If there is an issue with the session retrieval or repository updates.
 */
export async function POST(request: NextRequest) {
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

    const fixes = [];

    // Fix repository IDs by fetching actual data from GitHub
    for (const repo of selectedRepos) {
      try {
        const [owner, repoName] = repo.repoName.split('/');
        const { data: githubRepo } = await octokit.rest.repos.get({
          owner,
          repo: repoName,
        });

        if (repo.repoId !== githubRepo.id) {
          // Update the repository ID
          await prisma.selectedRepository.update({
            where: {
              userId_repoId: {
                userId: repo.userId,
                repoId: repo.repoId,
              },
            },
            data: {
              repoId: githubRepo.id,
              repoUrl: githubRepo.html_url,
              isPrivate: githubRepo.private,
            },
          });

          fixes.push({
            name: repo.repoName,
            oldId: repo.repoId,
            newId: githubRepo.id,
            fixed: true,
          });
        } else {
          fixes.push({
            name: repo.repoName,
            id: repo.repoId,
            fixed: false,
          });
        }
      } catch (error) {
        fixes.push({
          name: repo.repoName,
          error: error.message,
          fixed: false,
        });
      }
    }

    return NextResponse.json({
      message: 'Repository IDs checked and fixed',
      fixes,
    });
  } catch (error: any) {
    console.error('Repository fix error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Fix failed',
      },
      { status: 500 }
    );
  }
}
