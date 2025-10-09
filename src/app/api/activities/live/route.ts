import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Establishes a Server-Sent Events (SSE) connection for live updates.
 *
 * The function retrieves the user session from the request headers and checks for user authentication.
 * If authenticated, it creates a readable stream that sends a connection message and periodic heartbeat messages
 * to keep the connection alive. It also handles cleanup when the connection is closed.
 * In case of an error during the process, it logs the error and returns a failure response.
 *
 * @param request - The NextRequest object containing the request details.
 * @returns A Response object containing the SSE stream.
 * @throws Error If there is an issue establishing the connection.
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

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = JSON.stringify({
          type: 'connected',
          message: 'Connected to live updates',
          timestamp: new Date().toISOString(),
        });

        controller.enqueue(`data: ${data}\n\n`);

        // Store the controller for this user's connection
        if (!global.userConnections) {
          global.userConnections = new Map();
        }
        global.userConnections.set(userId, controller);

        // Send periodic heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            });
            controller.enqueue(`data: ${heartbeat}\n\n`);
          } catch (error) {
            clearInterval(heartbeatInterval);
            global.userConnections?.delete(userId);
          }
        }, 30000); // Send heartbeat every 30 seconds

        // Clean up on connection close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          global.userConnections?.delete(userId);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('SSE connection error:', error);
    return NextResponse.json(
      { error: 'Failed to establish connection' },
      { status: 500 }
    );
  }
}

// Helper function to broadcast updates to connected users
/**
 * Broadcasts an activity update message to a specific user.
 *
 * This function checks if the user identified by userId has an active connection. If so, it constructs a message containing the provided data and a timestamp, then enqueues it for transmission. In case of an error during message creation or transmission, it logs the error and removes the user's connection from the global userConnections map.
 *
 * @param {string} userId - The ID of the user to whom the message will be broadcasted.
 * @param {any} data - The data to be included in the broadcast message.
 */
export function broadcastToUser(userId: string, data: any) {
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

// Helper function to broadcast to all connected users
export function broadcastToAll(data: any) {
  if (global.userConnections) {
    for (const [userId, controller] of global.userConnections) {
      try {
        const message = JSON.stringify({
          type: 'activity_update',
          data,
          timestamp: new Date().toISOString(),
        });
        controller.enqueue(`data: ${message}\n\n`);
      } catch (error) {
        console.error('Failed to broadcast to user:', userId, error);
        global.userConnections.delete(userId);
      }
    }
  }
}
