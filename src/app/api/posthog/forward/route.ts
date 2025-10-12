import { NextRequest, NextResponse } from 'next/server';
import { PostHog } from 'posthog-node';

// Initialize PostHog server client
let posthog: PostHog | null = null;

function getPostHogClient() {
  if (!posthog) {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || process.env.POSTHOG_HOST;
    
    if (!apiKey || !host) {
      console.error('PostHog configuration missing:', {
        hasKey: !!apiKey,
        hasHost: !!host,
        publicKey: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
        publicHost: !!process.env.NEXT_PUBLIC_POSTHOG_HOST,
        serverKey: !!process.env.POSTHOG_KEY,
        serverHost: !!process.env.POSTHOG_HOST,
      });
      return null;
    }
    
    posthog = new PostHog(apiKey, {
      host: host,
    });
  }
  return posthog;
}

/**
 * Handles the POST request to forward events to PostHog.
 *
 * This function processes the incoming request, extracts the event and properties, and validates the input.
 * It retrieves the PostHog client and prepares the properties for tracking, including user information.
 * Depending on the event type, it either captures an exception or a regular event, and ensures data is flushed to PostHog.
 *
 * @param request - The incoming NextRequest object containing the event data.
 * @returns A JSON response indicating the success or failure of the event forwarding.
 * @throws Error If an error occurs during the processing of the request or forwarding to PostHog.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties } = body;

    console.log('PostHog forwarding request:', { event, properties });

    if (!event) {
      return NextResponse.json(
        { error: 'Event is required' },
        { status: 400 }
      );
    }

    // Get PostHog client
    const posthogClient = getPostHogClient();
    if (!posthogClient) {
      return NextResponse.json(
        { error: 'PostHog configuration missing' },
        { status: 500 }
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
      
      console.log('Sending exception to PostHog:', {
        distinctId,
        errorMessage: error.message,
        errorName: error.name,
        properties: posthogProperties,
      });
      
      posthogClient.captureException(error, {
        distinctId,
        properties: posthogProperties,
      });
    } else {
      // Handle regular events
      console.log('Sending event to PostHog:', {
        distinctId,
        event,
        properties: posthogProperties,
      });
      
      posthogClient.capture({
        distinctId,
        event,
        properties: posthogProperties,
      });
    }

    // Flush to ensure data is sent
    console.log('Flushing PostHog data...');
    await posthogClient.flush();
    console.log('PostHog data flushed successfully');

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
