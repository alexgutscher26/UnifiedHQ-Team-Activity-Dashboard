import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  fetchGithubActivity,
  saveGithubActivities,
  isGithubConnected,
  getSelectedRepositoryCount,
} from '@/lib/integrations/github';

// Helper function to broadcast updates to connected users
/**
 * Broadcasts an activity update message to a specific user.
 *
 * This function checks if the user identified by userId has an active connection. If so, it constructs a message containing the provided data and a timestamp, then enqueues it for transmission. In case of an error during message creation or transmission, it logs the error and removes the user's connection from the global userConnections.
 *
 * @param {string} userId - The ID of the user to whom the message will be broadcasted.
 * @param {any} data - The data to be included in the broadcast message.
 */
function broadcastToUser(userId: string, data: any) {
  if (global.userConnections?.has(userId)) {
    const controller = global.userConnections.get(userId);
    try {
      const message = JSON.stringify({
        type: 'activity_update',
        data,
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(`data: ${message}\n\n`);
    } catch (error) {
      console.error('Failed to broadcast to user:', error);
      global.userConnections?.delete(userId);
    }
  }
}

/**
 * Handles the POST request to sync GitHub activities for the authenticated user.
 *
 * This function retrieves the user's session, checks if GitHub is connected, and counts the selected repositories.
 * If no repositories are selected, it returns a message indicating this. It then fetches the user's GitHub activities,
 * saves them, and broadcasts an update to connected clients. Error handling is implemented for various failure scenarios.
 *
 * @param request - The NextRequest object containing the request details.
 * @returns A JSON response indicating the success or failure of the sync operation, along with relevant messages and data.
 * @throws Error If the GitHub token is expired or invalid, or if any other error occurs during the sync process.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if GitHub is connected
    const connected = await isGithubConnected(userId);
    if (!connected) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 400 }
      );
    }

    // Get selected repository count
    const selectedRepoCount = await getSelectedRepositoryCount(userId);

    if (selectedRepoCount === 0) {
      return NextResponse.json({
        success: true,
        message:
          'No repositories selected. Please select repositories to track activity.',
        count: 0,
        selectedRepositories: 0,
      });
    }

    // Fetch and save GitHub activity
    const activities = await fetchGithubActivity(userId);
    await saveGithubActivities(userId, activities);

    // Broadcast update to connected clients
    try {
      broadcastToUser(userId, {
        type: 'sync_completed',
        count: activities.length,
        selectedRepositories: selectedRepoCount,
        message: `Synced ${activities.length} GitHub activities from ${selectedRepoCount} selected repositories`,
      });
    } catch (error) {
      console.error('Failed to broadcast sync update:', error);
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${activities.length} GitHub activities from ${selectedRepoCount} selected repositories`,
      count: activities.length,
      selectedRepositories: selectedRepoCount,
      activities: activities.slice(0, 10), // Return first 10 activities for immediate display
    });
  } catch (error: any) {
    console.error('GitHub sync error:', error);

    if (
      error.message.includes('token expired') ||
      error.message.includes('invalid')
    ) {
      return NextResponse.json(
        {
          error: 'GitHub token expired. Please reconnect your account.',
          code: 'TOKEN_EXPIRED',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to sync GitHub activity',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const connected = await isGithubConnected(userId);

    return NextResponse.json({
      connected,
      message: connected ? 'GitHub is connected' : 'GitHub not connected',
    });
  } catch (error) {
    console.error('GitHub status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
