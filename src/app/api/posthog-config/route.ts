import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles the GET request and returns the PostHog configuration status.
 *
 * This function retrieves the PostHog key and host from environment variables,
 * constructs a configuration object, and returns a JSON response indicating
 * whether PostHog is properly configured. In case of an error, it returns an
 * error message along with a timestamp.
 *
 * @param request - The NextRequest object representing the incoming request.
 */
export async function GET(request: NextRequest) {
  try {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    
    const config = {
      hasKey: !!posthogKey,
      hasHost: !!posthogHost,
      keyLength: posthogKey?.length || 0,
      host: posthogHost,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      status: 'success',
      config,
      message: config.hasKey && config.hasHost 
        ? 'PostHog is properly configured' 
        : 'PostHog configuration is incomplete',
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
