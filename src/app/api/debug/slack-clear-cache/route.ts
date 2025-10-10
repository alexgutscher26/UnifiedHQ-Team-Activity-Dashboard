import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Clear all Slack cache for this user
    await prisma.slackCache.deleteMany({
      where: {
        userId,
      },
    });

    console.log(`[Slack Cache Clear] Cleared all cache for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Slack cache cleared successfully',
    });
  } catch (error) {
    console.error('Slack cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
