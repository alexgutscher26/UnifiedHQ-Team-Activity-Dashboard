import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGithubActivities } from '@/lib/integrations/github';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const limit = 20; // Limit to 20 most recent activities

    // Get GitHub activities
    const githubActivities = await getGithubActivities(userId, limit);

    // Convert to the format expected by the frontend
    const activities = githubActivities.map(activity => ({
      id: activity.externalId || activity.timestamp.getTime().toString(),
      source: activity.source,
      title: activity.title,
      description: activity.description,
      timestamp: activity.timestamp,
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
