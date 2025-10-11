import { NextRequest, NextResponse } from 'next/server';
import { PostHog } from 'posthog-node';

// Initialize PostHog server client
const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
  }
);

/**
 * Handles the POST request to forward events to PostHog.
 *
 * This function extracts the event and properties from the request body, validates the presence of the event,
 * and prepares the necessary properties including user information. It captures either exception or regular events
 * based on the event type and ensures data is flushed to PostHog. In case of errors, it logs the error and returns
 * an appropriate response.
 *
 * @param request - The NextRequest object containing the request data.
 * @returns A JSON response indicating the success or failure of the event forwarding.
 * @throws Error If there is an issue with forwarding the event to PostHog.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event is required' },
        { status: 400 }
      );
    }

    // Extract user information
    const distinctId = properties?.distinct_id || 'anonymous';
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';

    // Prepare PostHog properties
    const posthogProperties = {
      ...properties,
      $ip: ip,
      $user_agent: userAgent,
      server_forwarded: true,
      fallback_client: properties?.fallback_client || false,
    };

    // Send to PostHog
    if (event === 'exception') {
      // Handle exception events specially
      const error = new Error(properties?.error_message || 'Unknown error');
      error.stack = properties?.error_stack;
      error.name = properties?.error_name || 'Error';
      
      posthog.captureException(error, {
        distinctId,
        properties: posthogProperties,
      });
    } else {
      // Handle regular events
      posthog.capture({
        distinctId,
        event,
        properties: posthogProperties,
      });
    }

    // Flush to ensure data is sent
    await posthog.flush();

    return NextResponse.json({
      success: true,
      message: 'Event forwarded to PostHog successfully',
      event,
      distinctId,
    });

  } catch (error) {
    console.error('PostHog forwarding error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to forward event to PostHog',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
/**
 * Handles OPTIONS HTTP requests and returns a response with CORS headers.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
