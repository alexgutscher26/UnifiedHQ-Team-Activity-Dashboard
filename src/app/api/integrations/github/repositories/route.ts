import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-user';
import { Octokit } from '@octokit/rest';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// Helper function to broadcast repository changes
/**
 * Broadcasts a change in a repository to the connected user.
 *
 * This function checks if the user identified by userId has an active connection. If so, it constructs a message
 * containing the action (either 'added' or 'removed') and the repository name, then attempts to send this message
 * to the user. In case of an error during the broadcasting process, it logs the error and removes the user's connection.
 *
 * @param {string} userId - The ID of the user to whom the repository change is being broadcasted.
 * @param {'added' | 'removed'} action - The action indicating whether a repository was added or removed.
 * @param {string} repoName - The name of the repository that was changed.
 */
function broadcastRepositoryChange(
  userId: string,
  action: 'added' | 'removed',
  repoName: string
) {
  if (global.userConnections?.has(userId)) {
    const controller = global.userConnections.get(userId);
    try {
      const message = JSON.stringify({
        type: 'repository_update',
        data: {
          action,
          repoName,
          message: `Repository ${repoName} ${action}`,
        },
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(`data: ${message}\n\n`);
    } catch (error) {
      console.error('Failed to broadcast repository change:', error);
      global.userConnections?.delete(userId);
    }
  }
}

/**
 * Handles the GET request to fetch user repositories from GitHub.
 *
 * This function first retrieves the current user and checks for authorization.
 * It then fetches the GitHub connection for the user and retrieves the user's repositories using the Octokit library.
 * The repositories are formatted to include selection status based on the user's selected repositories stored in the database.
 *
 * @param request - The incoming NextRequest object.
 * @returns A JSON response containing the formatted repositories and their total count.
 * @throws Error If the GitHub token is expired or if there is a failure in fetching repositories.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get GitHub connection
    const connection = await prisma.connection.findFirst({
      where: {
        userId: user.id,
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

    // Fetch user repositories
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
      type: 'all', // Include both public and private repos
    });

    // Get currently selected repositories
    const selectedRepos = await prisma.selectedRepository.findMany({
      where: {
        userId: user.id,
      },
    });

    const selectedRepoIds = new Set(selectedRepos.map(repo => repo.repoId));

    // Format repositories with selection status
    const formattedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.full_name,
      owner: repo.owner.login,
      url: repo.html_url,
      description: repo.description,
      isPrivate: repo.private,
      isSelected: selectedRepoIds.has(repo.id),
      updatedAt: repo.updated_at,
      language: repo.language,
      stars: repo.stargazers_count,
    }));

    return NextResponse.json({
      repositories: formattedRepos,
      total: repos.length,
    });
  } catch (error: any) {
    console.error('Error fetching repositories:', error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: 'GitHub token expired. Please reconnect your account.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

/**
 * Handles the POST request to add a repository to the user's selected list.
 *
 * The function first retrieves the current user and checks for authorization. It then parses the request body for required fields. If any required fields are missing, it responds with a 400 status. If all fields are present, it upserts the repository information into the database and broadcasts the change. Finally, it returns a success message or handles any errors that occur during the process.
 *
 * @param request - The NextRequest object containing the request data.
 * @returns A JSON response indicating the success or failure of the operation.
 * @throws Error If an error occurs while processing the request.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { repoId, repoName, repoOwner, repoUrl, isPrivate } = body;

    if (!repoId || !repoName || !repoOwner || !repoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add repository to selected list
    await prisma.selectedRepository.upsert({
      where: {
        userId_repoId: {
          userId: user.id,
          repoId: repoId,
        },
      },
      update: {
        repoName,
        repoOwner,
        repoUrl,
        isPrivate: isPrivate || false,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        repoId,
        repoName,
        repoOwner,
        repoUrl,
        isPrivate: isPrivate || false,
      },
    });

    // Broadcast repository change
    broadcastRepositoryChange(user.id, 'added', repoName);

    return NextResponse.json({ message: 'Repository added successfully' });
  } catch (error: any) {
    console.error('Error adding repository:', error);
    return NextResponse.json(
      { error: 'Failed to add repository' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId');

    if (!repoId) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }

    // Remove repository from selected list
    await prisma.selectedRepository.deleteMany({
      where: {
        userId: user.id,
        repoId: parseInt(repoId),
      },
    });

    return NextResponse.json({ message: 'Repository removed successfully' });
  } catch (error: any) {
    console.error('Error removing repository:', error);
    return NextResponse.json(
      { error: 'Failed to remove repository' },
      { status: 500 }
    );
  }
}
