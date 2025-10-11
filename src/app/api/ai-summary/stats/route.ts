import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d'; // 24h, 7d, 30d

    // Calculate time range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get total summary count for the time range
    const totalSummaries = await prisma.aISummary.count({
      where: {
        userId,
        generatedAt: {
          gte: startDate,
          lte: now,
        },
      },
    });

    // Get the most recent summary
    const mostRecentSummary = await prisma.aISummary.findFirst({
      where: {
        userId,
        generatedAt: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
      select: {
        generatedAt: true,
        metadata: true,
      },
    });

    // Get all summaries for activity count calculation
    const allSummaries = await prisma.aISummary.findMany({
      where: {
        userId,
        generatedAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        metadata: true,
      },
    });

    // Calculate total activities from all summaries
    const totalActivities = allSummaries.reduce((sum, summary) => {
      const metadata = summary.metadata as any;
      return sum + (metadata?.activityCount || 0);
    }, 0);

    // Calculate average activities per summary
    const averageActivities = allSummaries.length > 0 
      ? Math.round(totalActivities / allSummaries.length)
      : 0;

    // Get active repositories count from the most recent summary
    const activeRepositories = mostRecentSummary?.metadata 
      ? (mostRecentSummary.metadata as any)?.activeRepositories || 0
      : 0;

    // Get last update time
    const lastUpdate = mostRecentSummary?.generatedAt || now;

    return NextResponse.json({
      count: totalSummaries,
      status: totalSummaries > 0 ? 'Active' : 'Inactive',
      details: totalSummaries > 0 
        ? `${totalSummaries} summary${totalSummaries === 1 ? '' : 'ies'} generated`
        : 'No summaries generated',
      lastUpdate: lastUpdate.toISOString(),
      breakdown: {
        totalActivities,
        averageActivities,
        activeRepositories,
        summariesGenerated: totalSummaries,
      },
      metadata: {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching AI summary stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch AI summary statistics',
      },
      { status: 500 }
    );
  }
}
