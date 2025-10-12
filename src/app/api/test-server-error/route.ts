import { NextRequest, NextResponse } from 'next/server';
import { captureServerException } from '@/lib/posthog-server';

/**
 * Handles a GET request and simulates a server-side error for testing purposes.
 *
 * This function captures a simulated error using PostHog for tracking, including relevant metadata such as the request method and URL. If the error capturing succeeds, it returns a JSON response indicating the error. In case of any failure during the process, it logs the error and returns a generic error response.
 *
 * @param request - The NextRequest object representing the incoming request.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Test server error API called');
    
    // Simulate a server-side error for testing
    const error = new Error('Test server-side error for PostHog tracking');
    error.name = 'TestServerError';
    
    console.log('Capturing server error with PostHog...');
    
    // Capture the error with PostHog
    await captureServerException(error, 'test-user', {
      test_type: 'server_error',
      test_timestamp: new Date().toISOString(),
      test_context: 'PostHog Error Tester Server',
      request_method: 'GET',
      request_url: request.url,
      server_component: true,
    });

    console.log('Server error captured successfully');

    // Return the error response
    return NextResponse.json(
      { 
        error: 'Test server-side error generated for PostHog tracking',
        message: 'This is an intentional test error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in test-server-error API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate test server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
