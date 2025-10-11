import { NextRequest, NextResponse } from 'next/server';
import { captureServerException } from '@/lib/posthog-server';

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
