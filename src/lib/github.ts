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

interface GitHubApiResponse {
  success: boolean;
  data: {
    activities: GitHubActivity[];
    stats: {
      commits: number;
      pullRequests: number;
      issues: number;
      releases: number;
      stars: number;
    };
    lastUpdated: string;
  };
  error?: string;
  details?: string;
}

export async function fetchGitHubActivities(
  owner: string, 
  repo: string, 
  token: string
): Promise<GitHubActivity[]> {
  try {
    const response = await fetch(
      `/api/github?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&token=${encodeURIComponent(token)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GitHubApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch GitHub data');
    }

    return result.data.activities;
  } catch (error) {
    console.error('Error fetching GitHub activities:', error);
    throw error;
  }
}

export async function fetchGitHubActivitiesWithSession(owner: string, repo: string): Promise<GitHubActivity[]> {
  try {
    const response = await fetch(`/api/github/session?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GitHubApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch GitHub data');
    }

    return result.data.activities;
  } catch (error) {
    console.error('Error fetching GitHub activities:', error);
    throw error;
  }
}

export async function fetchUserRepositories(): Promise<Repository[]> {
  try {
    const response = await fetch('/api/github/repositories');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch repositories');
    }

    return result.data.repositories;
  } catch (error) {
    console.error('Error fetching repositories:', error);
    throw error;
  }
}

export interface Repository {
  id: number
  name: string
  fullName: string
  owner: string
  description: string | null
  isPrivate: boolean
  updatedAt: string
  defaultBranch: string
}

export function getGitHubConfig() {
  // Try environment variables first (for production)
  const envOwner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
  const envRepo = process.env.NEXT_PUBLIC_GITHUB_REPO;
  const envToken = process.env.GITHUB_TOKEN;

  if (envOwner && envRepo && envToken) {
    return { owner: envOwner, repo: envRepo, token: envToken };
  }

  // Fall back to localStorage (for development/demo)
  if (typeof window !== 'undefined') {
    const localOwner = localStorage.getItem('github_owner');
    const localRepo = localStorage.getItem('github_repo');
    const localToken = localStorage.getItem('github_token');

    if (localOwner && localRepo && localToken) {
      return { owner: localOwner, repo: localRepo, token: localToken };
    }
  }

  return null;
}

export function saveGitHubConfig(owner: string, repo: string, token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('github_owner', owner);
    localStorage.setItem('github_repo', repo);
    localStorage.setItem('github_token', token);
  }
}

export type { GitHubActivity };
