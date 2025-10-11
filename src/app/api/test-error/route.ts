import { NextRequest, NextResponse } from 'next/server';
import { captureServerException } from '@/lib/posthog-server';

/**
 * Handles POST requests and simulates a server-side error for testing.
 *
 * This function captures a simulated error using PostHog for tracking purposes. It constructs an error object,
 * logs relevant information, and returns a JSON response indicating the error. If an exception occurs during
 * the error capturing process, it logs the error and returns a generic failure response.
 *
 * @param request - The NextRequest object representing the incoming request.
 */
export async function POST(request: NextRequest) {
  try {
    // Simulate a server-side error for testing
    const error = new Error('Test API error for PostHog tracking');
    
    // Capture the error with PostHog
    await captureServerException(error, 'test-user', {
      test_type: 'api_error',
      test_timestamp: new Date().toISOString(),
      test_context: 'PostHog Error Tester API',
      request_method: 'POST',
      request_url: request.url,
    });

    // Return the error response
    return NextResponse.json(
      { error: 'Test API error generated for PostHog tracking' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in test-error API:', error);
    return NextResponse.json(
      { error: 'Failed to generate test error' },
      { status: 500 }
    );
  }
}

/**
 * Handles GET requests and simulates a server error for tracking purposes.
 *
 * This function captures a simulated error using PostHog and returns a JSON response indicating the error.
 * If an error occurs during the process, it logs the error and returns a generic failure response.
 * The function utilizes the NextRequest object to gather request details for error tracking.
 *
 * @param request - The NextRequest object representing the incoming request.
 */
export async function GET(request: NextRequest) {
  try {
    // Simulate a different type of server error
    const error = new Error('Test GET API error for PostHog tracking');
    
    // Capture the error with PostHog
    await captureServerException(error, 'test-user', {
      test_type: 'api_get_error',
      test_timestamp: new Date().toISOString(),
      test_context: 'PostHog Error Tester API',
      request_method: 'GET',
      request_url: request.url,
    });

    // Return the error response
    return NextResponse.json(
      { error: 'Test GET API error generated for PostHog tracking' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in test-error API:', error);
    return NextResponse.json(
      { error: 'Failed to generate test error' },
      { status: 500 }
    );
  }
}
