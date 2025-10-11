import { NextRequest, NextResponse } from 'next/server';

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
