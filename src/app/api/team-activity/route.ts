import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-user';
import { fetchTeamActivityDataCached } from '@/lib/team-activity-service';
import { captureClientError } from '@/lib/posthog-client';

interface TeamActivity {
  id: string;
  type: 'commit' | 'pull_request' | 'issue' | 'review' | 'comment';
  title: string;
  description?: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    status: 'active' | 'away' | 'offline';
    lastActive: string;
  };
  repository: string;
  timestamp: string;
  status?: 'open' | 'closed' | 'merged' | 'draft';
  url?: string;
  metadata?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') || '30d') as '7d' | '30d' | '90d';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Fetch team activity data using the cached service
    const teamData = await fetchTeamActivityDataCached(user.id, timeRange);

    // Limit activities if requested
    const limitedActivities = teamData.activities.slice(0, limit);

    return NextResponse.json({
      data: limitedActivities,
      success: true,
      timestamp: new Date().toISOString(),
      meta: {
        total: teamData.activities.length,
        returned: limitedActivities.length,
        timeRange,
        members: teamData.members.length,
        stats: teamData.stats,
      },
    });
  } catch (error) {
    console.error('Team activity API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team activity';
    captureClientError(error instanceof Error ? error : new Error(errorMessage), {
      context: 'team_activity_api',
      endpoint: '/api/team-activity',
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
