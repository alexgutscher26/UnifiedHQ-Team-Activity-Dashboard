import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

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
