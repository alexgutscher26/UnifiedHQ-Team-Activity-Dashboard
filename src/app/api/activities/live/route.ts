import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Establish a Server-Sent Events (SSE) connection for live updates.
 *
 * The function first attempts to retrieve the user session from the request headers. If the session is not valid, it returns an SSE error message. Upon successful authentication, it creates a readable stream that sends connection confirmation and periodic heartbeat messages to the client. It also handles disconnection events to clean up resources.
 *
 * @param request - The NextRequest object containing the request details.
 * @returns A Response object containing the SSE stream for live updates.
 * @throws Error If there is an issue establishing the connection or during the stream processing.
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get session from cookies first
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      // Return SSE error message instead of JSON
      return new Response(
        `data: ${JSON.stringify({
          type: 'error',
          message: 'Unauthorized - please refresh the page',
          timestamp: new Date().toISOString(),
        })}\n\n`,
        {
          status: 401,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
          },
        }
      );
    }

    const userId = session.user.id;
    console.log(`[SSE] User ${userId} connecting to live updates`);

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        try {
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
              console.error('Heartbeat error:', error);
              clearInterval(heartbeatInterval);
              global.userConnections?.delete(userId);
            }
          }, 30000); // Send heartbeat every 30 seconds

          // Clean up on connection close
          request.signal.addEventListener('abort', () => {
            console.log(`[SSE] User ${userId} disconnected`);
            clearInterval(heartbeatInterval);
            global.userConnections?.delete(userId);
            try {
              controller.close();
            } catch (error) {
              console.error('Error closing controller:', error);
            }
          });
        } catch (error) {
          console.error('Error in SSE stream start:', error);
          try {
            controller.close();
          } catch (closeError) {
            console.error(
              'Error closing controller on start error:',
              closeError
            );
          }
        }
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
