import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  merged_at: string | null;
}

interface GitHubActivity {
  id: string;
  type: 'commit' | 'pull_request';
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
  details?: string;
  url: string;
}

async function fetchGitHubData(owner: string, repo: string, token: string) {
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Team-Dashboard-App',
  };

  try {
    // Fetch recent commits (last 10)
    const commitsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=10`,
      { headers }
    );

    if (!commitsResponse.ok) {
      throw new Error(`GitHub API error: ${commitsResponse.status}`);
    }

    const commits: GitHubCommit[] = await commitsResponse.json();

    // Fetch recent pull requests (last 10)
    const prsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=all&per_page=10&sort=updated`,
      { headers }
    );

    if (!prsResponse.ok) {
      throw new Error(`GitHub API error: ${prsResponse.status}`);
    }

    const pullRequests: GitHubPullRequest[] = await prsResponse.json();

    return { commits, pullRequests };
  } catch (error) {
    console.error('GitHub API Error:', error);
    throw error;
  }
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

function transformToActivity(
  commits: GitHubCommit[],
  pullRequests: GitHubPullRequest[]
): GitHubActivity[] {
  const activities: GitHubActivity[] = [];

  // Transform commits
  commits.forEach(commit => {
    activities.push({
      id: `commit-${commit.sha}`,
      type: 'commit',
      user: commit.author.login || commit.commit.author.name,
      avatar: commit.author.avatar_url || '/placeholder.svg',
      action: 'committed',
      target: commit.commit.message.split('\n')[0], // First line of commit message
      time: formatTimeAgo(commit.commit.author.date),
      details: `Commit ${commit.sha.substring(0, 7)}`,
      url: commit.html_url,
    });
  });

  // Transform pull requests
  pullRequests.forEach(pr => {
    const action =
      pr.state === 'open'
        ? 'opened pull request'
        : pr.merged_at
          ? 'merged pull request'
          : 'closed pull request';

    activities.push({
      id: `pr-${pr.id}`,
      type: 'pull_request',
      user: pr.user.login,
      avatar: pr.user.avatar_url,
      action,
      target: `#${pr.number} - ${pr.title}`,
      time: formatTimeAgo(pr.updated_at),
      details: `${pr.head.ref} → ${pr.base.ref}`,
      url: pr.html_url,
    });
  });

  // Sort by time (most recent first)
  return activities.sort((a, b) => {
    const timeA = a.time.includes('seconds')
      ? 0
      : a.time.includes('minutes')
        ? 1
        : a.time.includes('hours')
          ? 2
          : a.time.includes('days')
            ? 3
            : 4;
    const timeB = b.time.includes('seconds')
      ? 0
      : b.time.includes('minutes')
        ? 1
        : b.time.includes('hours')
          ? 2
          : b.time.includes('days')
            ? 3
            : 4;
    return timeA - timeB;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const token = searchParams.get('token');

    if (!owner || !repo || !token) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, token' },
        { status: 400 }
      );
    }

    const { commits, pullRequests } = await fetchGitHubData(owner, repo, token);
    const activities = transformToActivity(commits, pullRequests);

    return NextResponse.json({
      success: true,
      data: {
        activities,
        commits: commits.length,
        pullRequests: pullRequests.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GitHub API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch GitHub data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
