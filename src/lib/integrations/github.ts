import { Octokit } from '@octokit/rest';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export interface GitHubActivity {
  source: 'github';
  title: string;
  description?: string;
  timestamp: Date;
  externalId: string;
  metadata?: any;
}

export interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    login: string;
    display_login?: string;
    avatar_url: string;
  };
  repo: {
    name: string;
    id: number;
  };
  payload?: any;
  created_at: string;
  public: boolean;
}

/**
 * Fetch GitHub activity for a user using their stored access token
 * Only includes activity from selected repositories
 */
export async function fetchGithubActivity(
  userId: string
): Promise<GitHubActivity[]> {
  const connection = await prisma.connection.findFirst({
    where: {
      userId,
      type: 'github',
    },
  });

  if (!connection) {
    throw new Error('GitHub not connected');
  }

  // Get selected repositories
  const selectedRepos = await prisma.selectedRepository.findMany({
    where: {
      userId,
    },
  });

  if (selectedRepos.length === 0) {
    // If no repositories are selected, return empty array
    return [];
  }

  const selectedRepoIds = new Set(selectedRepos.map(repo => repo.repoId));

  const octokit = new Octokit({
    auth: connection.accessToken,
    userAgent: 'UnifiedHQ/1.0.0',
  });

  try {
    console.log('GitHub Activity Debug - Starting fetch...');
    console.log(
      'Selected repositories:',
      selectedRepos.map(r => ({ id: r.repoId, name: r.repoName }))
    );
    console.log('Access token exists:', !!connection.accessToken);

    // Test the token by getting user info first
    const { data: user } = await octokit.rest.users.getAuthenticated();

    if (!user.login) {
      throw new Error('Unable to get authenticated user information');
    }

    console.log('Authenticated user:', user.login);

    // Try to fetch user events - use a simpler approach first
    let events: any[] = [];
    try {
      const response =
        await octokit.rest.activity.listEventsForAuthenticatedUser({
          per_page: 50,
        });
      events = response.data;
      console.log(`Fetched ${events.length} events from GitHub`);
    } catch (apiError: any) {
      console.error('GitHub API Error:', apiError);
      console.error('API Error Status:', apiError.status);
      console.error('API Error Message:', apiError.message);

      // If the authenticated user events fail, try public events as fallback
      console.log('Trying fallback to public events...');
      const publicResponse =
        await octokit.rest.activity.listPublicEventsForUser({
          username: user.login,
          per_page: 50,
        });
      events = publicResponse.data;
      console.log(`Fetched ${events.length} public events as fallback`);
    }

    // Filter events to only include selected repositories
    const filteredEvents = events.filter(event =>
      selectedRepoIds.has(event.repo.id)
    );

    console.log(`GitHub Activity Debug:
      - Total events fetched: ${events.length}
      - Selected repositories: ${selectedRepoIds.size}
      - Filtered events: ${filteredEvents.length}
      - Selected repo IDs: ${Array.from(selectedRepoIds).join(', ')}
      - Event repo IDs: ${events.map(e => e.repo.id).join(', ')}
      - Event repo names: ${events.map(e => e.repo.name).join(', ')}
    `);

    if (filteredEvents.length === 0 && events.length > 0) {
      console.log('No events match selected repositories. This could mean:');
      console.log('1. No recent activity in selected repositories');
      console.log('2. Repository IDs are incorrect');
      console.log('3. Events are from different repositories');
    }

    return filteredEvents.map(mapGitHubEventToActivity);
  } catch (error: any) {
    if (error.status === 401) {
      throw new Error(
        'GitHub token expired or invalid. Please reconnect your GitHub account.'
      );
    }
    throw new Error(`Failed to fetch GitHub activity: ${error.message}`);
  }
}

/**
 * Map GitHub event to our unified activity format
 */
function mapGitHubEventToActivity(event: GitHubEvent): GitHubActivity {
  const actor = event.actor.display_login || event.actor.login;
  const repoName = event.repo.name;

  let title = '';
  let description = '';

  switch (event.type) {
    case 'PushEvent':
      const commits = event.payload?.commits || [];
      const commitCount = commits.length;
      title = `Pushed ${commitCount} commit${commitCount === 1 ? '' : 's'} to ${repoName}`;
      description = commits.length > 0 ? commits[0].message : undefined;
      break;

    case 'PullRequestEvent':
      const pr = event.payload?.pull_request;
      const action = event.payload?.action;
      title = `${action === 'opened' ? 'Opened' : action === 'closed' ? 'Closed' : action} PR #${pr?.number} in ${repoName}`;
      description = pr?.title;
      break;

    case 'IssuesEvent':
      const issue = event.payload?.issue;
      const issueAction = event.payload?.action;
      title = `${issueAction === 'opened' ? 'Opened' : issueAction === 'closed' ? 'Closed' : issueAction} issue #${issue?.number} in ${repoName}`;
      description = issue?.title;
      break;

    case 'IssueCommentEvent':
      const comment = event.payload?.comment;
      const issueForComment = event.payload?.issue;
      title = `Commented on issue #${issueForComment?.number} in ${repoName}`;
      description =
        comment?.body?.substring(0, 100) +
        (comment?.body?.length > 100 ? '...' : '');
      break;

    case 'PullRequestReviewEvent':
      const review = event.payload?.review;
      const prForReview = event.payload?.pull_request;
      title = `Reviewed PR #${prForReview?.number} in ${repoName}`;
      description =
        review?.body?.substring(0, 100) +
        (review?.body?.length > 100 ? '...' : '');
      break;

    case 'CreateEvent':
      const ref = event.payload?.ref;
      const refType = event.payload?.ref_type;
      title = `Created ${refType} ${ref ? `'${ref}'` : ''} in ${repoName}`;
      break;

    case 'DeleteEvent':
      const deletedRef = event.payload?.ref;
      const deletedRefType = event.payload?.ref_type;
      title = `Deleted ${deletedRefType} ${deletedRef ? `'${deletedRef}'` : ''} in ${repoName}`;
      break;

    case 'ForkEvent':
      const forkedRepo = event.payload?.forkee;
      title = `Forked ${repoName}`;
      description = forkedRepo?.full_name;
      break;

    case 'WatchEvent':
      title = `Starred ${repoName}`;
      break;

    case 'ReleaseEvent':
      const release = event.payload?.release;
      title = `Released ${release?.tag_name} in ${repoName}`;
      description = release?.name;
      break;

    default:
      title = `${event.type} in ${repoName}`;
      break;
  }

  return {
    source: 'github',
    title,
    description,
    timestamp: new Date(event.created_at),
    externalId: event.id,
    metadata: {
      eventType: event.type,
      actor: event.actor,
      repo: event.repo,
      payload: event.payload,
    },
  };
}

/**
 * Save GitHub activities to the database, avoiding duplicates
 */
export async function saveGithubActivities(
  userId: string,
  activities: GitHubActivity[]
): Promise<void> {
  for (const activity of activities) {
    await prisma.activity.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: activity.source,
          externalId: activity.externalId,
        },
      },
      update: {
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        metadata: activity.metadata,
      },
      create: {
        userId,
        source: activity.source,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        externalId: activity.externalId,
        metadata: activity.metadata,
      },
    });
  }
}

/**
 * Get stored GitHub activities for a user
 */
export async function getGithubActivities(
  userId: string,
  limit: number = 10
): Promise<GitHubActivity[]> {
  const activities = await prisma.activity.findMany({
    where: {
      userId,
      source: 'github',
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });

  return activities.map(activity => ({
    source: activity.source as 'github',
    title: activity.title,
    description: activity.description || undefined,
    timestamp: activity.timestamp,
    externalId: activity.externalId || '',
    metadata: activity.metadata,
  }));
}

/**
 * Check if user has GitHub connected
 */
export async function isGithubConnected(userId: string): Promise<boolean> {
  const connection = await prisma.connection.findFirst({
    where: {
      userId,
      type: 'github',
    },
  });
  return !!connection;
}

/**
 * Get count of selected repositories for a user
 */
export async function getSelectedRepositoryCount(
  userId: string
): Promise<number> {
  const count = await prisma.selectedRepository.count({
    where: {
      userId,
    },
  });
  return count;
}

/**
 * Disconnect GitHub integration
 */
export async function disconnectGithub(userId: string): Promise<void> {
  await prisma.connection.deleteMany({
    where: {
      userId,
      type: 'github',
    },
  });

  // Clean up selected repositories
  await prisma.selectedRepository.deleteMany({
    where: {
      userId,
    },
  });

  // Optionally clean up old activities
  await prisma.activity.deleteMany({
    where: {
      userId,
      source: 'github',
    },
  });
}
