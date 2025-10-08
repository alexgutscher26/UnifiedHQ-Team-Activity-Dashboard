import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Check if the user has a GitHub account connected
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'github',
      },
    });

    if (!account || !account.accessToken) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'GitHub account not connected',
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      message: 'GitHub account connected',
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });
  } catch (error) {
    console.error('GitHub Status API Error:', error);
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: 'Failed to check GitHub connection status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
