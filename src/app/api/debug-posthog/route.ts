import { NextRequest, NextResponse } from 'next/server';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug PostHog API called');
    
    // Check environment variables
    const envCheck = {
      hasPublicKey: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
      hasPublicHost: !!process.env.NEXT_PUBLIC_POSTHOG_HOST,
      hasServerKey: !!process.env.POSTHOG_KEY,
      hasServerHost: !!process.env.POSTHOG_HOST,
      publicKeyLength: process.env.NEXT_PUBLIC_POSTHOG_KEY?.length || 0,
      publicHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      serverKeyLength: process.env.POSTHOG_KEY?.length || 0,
      serverHost: process.env.POSTHOG_HOST,
    };
    
    console.log('Environment check:', envCheck);
    
    // Try to get PostHog client
    const posthog = getPostHogServer();
    
    if (!posthog) {
      return NextResponse.json({
        success: false,
        error: 'PostHog client not initialized',
        envCheck,
        message: 'PostHog server client could not be created',
      });
    }
    
    // Test basic PostHog functionality
    try {
      console.log('Testing PostHog capture...');
      
      await posthog.capture({
        distinctId: 'debug-test-user',
        event: 'Debug Test',
        properties: {
          test_type: 'debug',
          timestamp: new Date().toISOString(),
          debug_context: 'PostHog Debug API',
        },
      });
      
      await posthog.flush();
      console.log('PostHog capture test successful');
      
      return NextResponse.json({
        success: true,
        message: 'PostHog client working correctly',
        envCheck,
        posthogMethods: Object.getOwnPropertyNames(posthog).filter(name => typeof posthog[name] === 'function'),
      });
      
    } catch (captureError) {
      console.error('PostHog capture test failed:', captureError);
      
      return NextResponse.json({
        success: false,
        error: 'PostHog capture failed',
        envCheck,
        captureError: captureError instanceof Error ? captureError.message : 'Unknown error',
        posthogMethods: Object.getOwnPropertyNames(posthog).filter(name => typeof posthog[name] === 'function'),
      });
    }
    
  } catch (error) {
    console.error('Debug PostHog API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Debug API failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
