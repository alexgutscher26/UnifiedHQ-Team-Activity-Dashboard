import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      hasPublicKey: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
      hasPublicHost: !!process.env.NEXT_PUBLIC_POSTHOG_HOST,
      hasServerKey: !!process.env.POSTHOG_KEY,
      hasServerHost: !!process.env.POSTHOG_HOST,
      publicKeyLength: process.env.NEXT_PUBLIC_POSTHOG_KEY?.length || 0,
      publicHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      serverKeyLength: process.env.POSTHOG_KEY?.length || 0,
      serverHost: process.env.POSTHOG_HOST,
    };

    console.log('PostHog configuration check:', config);

    return NextResponse.json({
      success: true,
      config,
      message: 'PostHog configuration check completed',
    });
  } catch (error) {
    console.error('PostHog configuration check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check PostHog configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
