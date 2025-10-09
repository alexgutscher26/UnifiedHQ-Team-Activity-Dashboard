import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles a GET request to establish a Server-Sent Events (SSE) connection.
 *
 * This function initiates an SSE stream that sends a test message upon connection and periodically sends heartbeat messages every 5 seconds. It also handles connection closure by cleaning up the interval and closing the stream. In case of errors during message sending or connection establishment, appropriate error messages are logged, and a JSON response is returned with a failure status.
 *
 * @param request - The NextRequest object representing the incoming request.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[SSE Test] Connection attempt');

    // Simple SSE stream for testing
    const stream = new ReadableStream({
      start(controller) {
        console.log('[SSE Test] Stream started');

        // Send initial message
        const data = JSON.stringify({
          type: 'test',
          message: 'SSE connection test successful',
          timestamp: new Date().toISOString(),
        });

        controller.enqueue(`data: ${data}\n\n`);

        // Send periodic test messages
        const interval = setInterval(() => {
          try {
            const testData = JSON.stringify({
              type: 'heartbeat',
              message: 'Test heartbeat',
              timestamp: new Date().toISOString(),
            });
            controller.enqueue(`data: ${testData}\n\n`);
          } catch (error) {
            console.error('[SSE Test] Error sending heartbeat:', error);
            clearInterval(interval);
          }
        }, 5000);

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          console.log('[SSE Test] Connection closed');
          clearInterval(interval);
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
    console.error('[SSE Test] Error:', error);
    return NextResponse.json(
      { error: 'Failed to establish test connection' },
      { status: 500 }
    );
  }
}
