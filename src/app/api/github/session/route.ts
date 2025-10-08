import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

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

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  author: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  published_at: string;
  html_url: string;
  assets: Array<{
    name: string;
    download_count: number;
  }>;
}

interface GitHubStar {
  starred_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubActivity {
  id: string;
  type: 'commit' | 'pull_request' | 'issue' | 'release' | 'star';
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
  details?: string;
  url: string;
  labels?: string[];
  assignees?: string[];
}

async function fetchGitHubData(owner: string, repo: string, token: string) {
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Team-Dashboard-App'
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

    // Fetch recent issues (last 10)
    const issuesResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=all&per_page=10&sort=updated`,
      { headers }
    );
    
    if (!issuesResponse.ok) {
      throw new Error(`GitHub API error: ${issuesResponse.status}`);
    }
    
    const issues: GitHubIssue[] = await issuesResponse.json();

    // Fetch recent releases (last 5)
    const releasesResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases?per_page=5`,
      { headers }
    );
    
    if (!releasesResponse.ok) {
      throw new Error(`GitHub API error: ${releasesResponse.status}`);
    }
    
    const releases: GitHubRelease[] = await releasesResponse.json();

    // Fetch recent stargazers (last 10)
    const starsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/stargazers?per_page=10`,
      { headers }
    );
    
    if (!starsResponse.ok) {
      throw new Error(`GitHub API error: ${starsResponse.status}`);
    }
    
    const stars: GitHubStar[] = await starsResponse.json();

    return { commits, pullRequests, issues, releases, stars };
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
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

function transformToActivity(
  commits: GitHubCommit[], 
  pullRequests: GitHubPullRequest[], 
  issues: GitHubIssue[], 
  releases: GitHubRelease[], 
  stars: GitHubStar[]
): GitHubActivity[] {
  const activities: GitHubActivity[] = [];

  // Transform commits
  commits.forEach((commit) => {
    activities.push({
      id: `commit-${commit.sha}`,
      type: 'github',
      user: commit.author.login || commit.commit.author.name,
      avatar: commit.author.avatar_url || '/placeholder.svg',
      action: 'committed',
      target: commit.commit.message.split('\n')[0], // First line of commit message
      time: formatTimeAgo(commit.commit.author.date),
      details: `Commit ${commit.sha.substring(0, 7)}`,
      url: commit.html_url
    });
  });

  // Transform pull requests
  pullRequests.forEach((pr) => {
    const action = pr.state === 'open' 
      ? 'opened pull request' 
      : pr.merged_at 
        ? 'merged pull request' 
        : 'closed pull request';
    
    activities.push({
      id: `pr-${pr.id}`,
      type: 'github',
      user: pr.user.login,
      avatar: pr.user.avatar_url,
      action,
      target: `#${pr.number} - ${pr.title}`,
      time: formatTimeAgo(pr.updated_at),
      details: `${pr.head.ref} → ${pr.base.ref}`,
      url: pr.html_url
    });
  });

  // Transform issues
  issues.forEach((issue) => {
    const action = issue.state === 'open' 
      ? 'opened issue' 
      : 'closed issue';
    
    activities.push({
      id: `issue-${issue.id}`,
      type: 'github',
      user: issue.user.login,
      avatar: issue.user.avatar_url,
      action,
      target: `#${issue.number} - ${issue.title}`,
      time: formatTimeAgo(issue.updated_at),
      details: issue.labels.map(l => l.name).join(', '),
      url: issue.html_url,
      labels: issue.labels.map(l => l.name),
      assignees: issue.assignees.map(a => a.login)
    });
  });

  // Transform releases
  releases.forEach((release) => {
    const action = release.prerelease ? 'published prerelease' : 'published release';
    
    activities.push({
      id: `release-${release.id}`,
      type: 'github',
      user: release.author.login,
      avatar: release.author.avatar_url,
      action,
      target: release.name || release.tag_name,
      time: formatTimeAgo(release.published_at),
      details: `${release.assets.length} assets, ${release.assets.reduce((sum, asset) => sum + asset.download_count, 0)} downloads`,
      url: release.html_url
    });
  });

  // Transform stars
  stars.forEach((star) => {
    activities.push({
      id: `star-${star.user.login}-${Date.now()}`,
      type: 'github',
      user: star.user.login,
      avatar: star.user.avatar_url,
      action: 'starred',
      target: 'this repository',
      time: formatTimeAgo(star.starred_at),
      details: '⭐',
      url: `https://github.com/${star.user.login}`
    });
  });

  // Sort by time (most recent first)
  return activities.sort((a, b) => {
    const timeA = a.time.includes('seconds') ? 0 : 
                  a.time.includes('minutes') ? 1 : 
                  a.time.includes('hours') ? 2 : 
                  a.time.includes('days') ? 3 : 4;
    const timeB = b.time.includes('seconds') ? 0 : 
                  b.time.includes('minutes') ? 1 : 
                  b.time.includes('hours') ? 2 : 
                  b.time.includes('days') ? 3 : 4;
    return timeA - timeB;
  });
}

export async function GET(request: NextRequest) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers
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
        providerId: 'github'
      }
    });

    if (!account || !account.accessToken) {
      return NextResponse.json(
        { error: 'GitHub account not connected. Please connect your GitHub account first.' },
        { status: 400 }
      );
    }

    // Get repository from query parameters
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Repository not specified. Please provide owner and repo parameters.' },
        { status: 400 }
      );
    }

    const { commits, pullRequests, issues, releases, stars } = await fetchGitHubData(owner, repo, account.accessToken);
    const activities = transformToActivity(commits, pullRequests, issues, releases, stars);

    return NextResponse.json({
      success: true,
      data: {
        activities,
        stats: {
          commits: commits.length,
          pullRequests: pullRequests.length,
          issues: issues.length,
          releases: releases.length,
          stars: stars.length
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('GitHub API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch GitHub data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
