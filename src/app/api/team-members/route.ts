import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-user';
import { fetchTeamActivityDataCached } from '@/lib/team-activity-service';
import { captureClientError } from '@/lib/posthog-client';

interface TeamMember {
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
}

/**
 * Handles the GET request to fetch team members' activity data.
 *
 * The function first retrieves the current user and checks for authorization. If the user is unauthorized, it returns a 401 response.
 * It then extracts the time range from the request's search parameters, defaults to '30d' if not provided, and fetches the team activity data using a cached service.
 * Finally, it returns the team members' data along with metadata, or handles any errors that occur during the process.
 *
 * @param request - The incoming NextRequest object containing the request details.
 * @returns A JSON response containing the team members' data, success status, and metadata.
 * @throws Error If an error occurs while fetching the team members' data.
 */
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
      data: teamData.members,
      success: true,
      timestamp: new Date().toISOString(),
      meta: {
        total: teamData.members.length,
        timeRange,
        stats: teamData.stats,
      },
    });
  } catch (error) {
    console.error('Team members API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team members';
    captureClientError(error instanceof Error ? error : new Error(errorMessage), {
      context: 'team_members_api',
      endpoint: '/api/team-members',
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
