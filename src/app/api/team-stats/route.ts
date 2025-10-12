import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-user';
import { fetchTeamActivityDataCached } from '@/lib/team-activity-service';
import { captureClientError } from '@/lib/posthog-client';

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
  totalReviews: number;
  averageActivityPerDay: number;
  topContributors: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    status: 'active' | 'away' | 'offline';
    lastActive: string;
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
  }>;
  activityTrends: Array<{
    date: string;
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
  }>;
  repositoryStats: Array<{
    name: string;
    commits: number;
    pullRequests: number;
    issues: number;
    contributors: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') || '30d') as '7d' | '30d' | '90d';

    // Fetch team activity data using the cached service
    const teamData = await fetchTeamActivityDataCached(user.id, timeRange);

    return NextResponse.json({
      data: teamData.stats,
      success: true,
      timestamp: new Date().toISOString(),
      meta: {
        timeRange,
        members: teamData.members.length,
        activities: teamData.activities.length,
      },
    });
  } catch (error) {
    console.error('Team stats API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team stats';
    captureClientError(error instanceof Error ? error : new Error(errorMessage), {
      context: 'team_stats_api',
      endpoint: '/api/team-stats',
    });

    return NextResponse.json(
      {
        data: null,
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
