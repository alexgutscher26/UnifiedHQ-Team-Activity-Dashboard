import { NextRequest, NextResponse } from 'next/server';
import { captureServerException } from '@/lib/posthog-server';

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
