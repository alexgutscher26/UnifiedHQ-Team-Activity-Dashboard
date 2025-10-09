import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGithubActivities } from '@/lib/integrations/github';

/**
 * Handles the GET request to fetch GitHub activities for the authenticated user.
 *
 * This function retrieves the user's session from the authentication API and checks if the user is authorized.
 * If authorized, it fetches the user's GitHub activities, formats them for the frontend, sorts them by timestamp,
 * and returns the most recent activities along with the total count. In case of an error, it logs the error and
 * returns a failure response.
 *
 * @param request - The incoming NextRequest object containing the request headers.
 * @returns A JSON response containing the most recent activities and their count.
 * @throws Error If there is an issue fetching the activities or if the user is unauthorized.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const limit = 5; // Limit to 5 most recent activities for the feed

    // Get GitHub activities
    const githubActivities = await getGithubActivities(userId, limit);

    // Convert to the format expected by the frontend
    const activities = githubActivities.map(activity => ({
      id: activity.externalId || activity.timestamp.getTime().toString(),
      source: activity.source,
      title: activity.title,
      description: activity.description,
      timestamp: activity.timestamp.toISOString(), // Convert to ISO string for JSON serialization
      externalId: activity.externalId,
      metadata: activity.metadata,
    }));

    // Sort by timestamp (most recent first)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      activities: activities.slice(0, limit),
      count: activities.length,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch activities',
      },
      { status: 500 }
    );
  }
}
