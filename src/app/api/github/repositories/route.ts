import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  updated_at: string;
  default_branch: string;
}

/**
 * Handles the GET request to fetch the user's GitHub repositories.
 *
 * This function retrieves the session using Better Auth, checks for the user's GitHub OAuth token in the database,
 * and fetches the user's repositories from the GitHub API. It formats the repository data into a simpler structure
 * before returning it. If any step fails, appropriate error responses are returned.
 *
 * @param request - The incoming NextRequest object containing the request details.
 * @returns A JSON response containing either the formatted repositories or an error message.
 * @throws Error If there is an issue with the GitHub API response or other unexpected errors occur.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's GitHub OAuth token from the database
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'github',
      },
    });

    if (!account || !account.accessToken) {
      return NextResponse.json(
        {
          error:
            'GitHub account not connected. Please connect your GitHub account first.',
        },
        { status: 400 }
      );
    }

    // Fetch user's repositories
    const headers = {
      Authorization: `token ${account.accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Team-Dashboard-App',
    };

    const response = await fetch(
      `${GITHUB_API_BASE}/user/repos?sort=updated&per_page=50`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repositories: GitHubRepository[] = await response.json();

    // Transform to a simpler format
    const formattedRepos = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      description: repo.description,
      isPrivate: repo.private,
      updatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
    }));

    return NextResponse.json({
      success: true,
      data: {
        repositories: formattedRepos,
      },
    });
  } catch (error) {
    console.error('GitHub Repositories API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch repositories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
