import { NextRequest, NextResponse } from 'next/server';
import { captureServerException } from '@/lib/posthog-server';

export async function GET(request: NextRequest) {
  try {
    // Simulate a server-side error for testing
    const error = new Error('Test server-side error for PostHog tracking');
    
    // Capture the error with PostHog
    await captureServerException(error, 'test-user', {
      test_type: 'server_error',
      test_timestamp: new Date().toISOString(),
      test_context: 'PostHog Error Tester Server',
      request_method: 'GET',
      request_url: request.url,
      server_component: true,
    });

    // Return the error response
    return NextResponse.json(
      { error: 'Test server-side error generated for PostHog tracking' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in test-server-error API:', error);
    return NextResponse.json(
      { error: 'Failed to generate test server error' },
      { status: 500 }
    );
  }
}
