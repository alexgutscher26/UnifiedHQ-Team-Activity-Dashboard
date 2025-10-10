import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import { AISummaryService, AISummaryData } from '@/lib/ai-summary-service';
import { Activity } from '@/types/components';

const prisma = new PrismaClient();

/**
 * Handles the GET request to fetch AI summaries for a user.
 *
 * This function retrieves the user's session, checks for authorization, and calculates the time range for fetching summaries.
 * It checks if a new daily summary needs to be generated based on the user's account age and the time since the last summary.
 * If necessary, it auto-generates a summary using activity data and saves it to the database. Finally, it returns the summaries in JSON format.
 *
 * @param request - The NextRequest object containing the request details.
 * @returns A JSON response containing the summaries and additional metadata.
 * @throws Error If there is an issue fetching AI summaries or if the user is not found.
 */
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
    const limit = parseInt(searchParams.get('limit') || '5');
    const timeRange = searchParams.get('timeRange') || '24h'; // 24h, 7d, 30d

    // Calculate time range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get existing summaries
    const summaries = await prisma.aISummary.findMany({
      where: {
        userId,
        timeRangeStart: {
          gte: startDate,
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
      take: limit,
    });

    // Check if user needs a daily summary (every 24 hours from account creation)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate if it's time for a new daily summary
    const accountAge = now.getTime() - user.createdAt.getTime();
    const daysSinceCreation = Math.floor(accountAge / (24 * 60 * 60 * 1000));
    const shouldHaveSummary = daysSinceCreation >= 0; // Always generate summary for any account

    // Check if it's been 24 hours since last summary or no summaries exist
    const lastSummary = summaries[0];
    const hoursSinceLastSummary = lastSummary
      ? (now.getTime() - new Date(lastSummary.generatedAt).getTime()) /
        (60 * 60 * 1000)
      : 24; // If no summaries, consider it as 24+ hours

    // Auto-generate summary if it's been 24+ hours since last summary
    if (hoursSinceLastSummary >= 24 && shouldHaveSummary) {
      const activityCount = await prisma.activity.count({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: now,
          },
        },
      });

      // Generate summary even with minimal activity (for daily summaries)
      if (activityCount >= 1) {
        try {
          // Validate OpenRouter connection
          const isConnected = await AISummaryService.validateConnection();
          if (isConnected) {
            // Get activities for auto-generation
            const activities = await prisma.activity.findMany({
              where: {
                userId,
                timestamp: {
                  gte: startDate,
                  lte: now,
                },
              },
              orderBy: {
                timestamp: 'desc',
              },
              take: 100,
            });

            // Get team context
            const [repositories, channels] = await Promise.all([
              prisma.selectedRepository.findMany({
                where: { userId },
                select: { repoName: true },
              }),
              prisma.selectedChannel.findMany({
                where: { userId },
                select: { channelName: true },
              }),
            ]);

            // Prepare data for AI summary
            const summaryData: AISummaryData = {
              activities: activities.map(activity => ({
                id: activity.id,
                source: activity.source,
                title: activity.title,
                description: activity.description,
                timestamp: activity.timestamp,
                externalId: activity.externalId,
                metadata: activity.metadata,
              })) as Activity[],
              timeRange: {
                start: startDate,
                end: now,
              },
              teamContext: {
                repositories: repositories.map(r => r.repoName),
                channels: channels.map(c => c.channelName),
                teamSize: 1,
              },
            };

            // Generate AI summary
            const aiSummary = await AISummaryService.generateSummary(
              userId,
              summaryData
            );

            // Save to database
            const savedSummary = await prisma.aISummary.create({
              data: {
                userId,
                title: aiSummary.title,
                keyHighlights: aiSummary.keyHighlights,
                actionItems: aiSummary.actionItems,
                insights: aiSummary.insights,
                generatedAt: aiSummary.generatedAt,
                timeRangeStart: aiSummary.timeRange.start,
                timeRangeEnd: aiSummary.timeRange.end,
                metadata: aiSummary.metadata,
              },
            });

            // Return the newly generated summary
            return NextResponse.json({
              summaries: [
                {
                  id: savedSummary.id,
                  title: savedSummary.title,
                  keyHighlights: savedSummary.keyHighlights,
                  actionItems: savedSummary.actionItems,
                  insights: savedSummary.insights,
                  generatedAt: savedSummary.generatedAt,
                  timeRange: {
                    start: savedSummary.timeRangeStart,
                    end: savedSummary.timeRangeEnd,
                  },
                  metadata: savedSummary.metadata,
                },
              ],
              count: 1,
              autoGenerated: true,
            });
          }
        } catch (error) {
          console.error('Auto-generation failed:', error);
          // Continue with empty results if auto-generation fails
        }
      }
    }

    return NextResponse.json({
      summaries: summaries.map(summary => ({
        id: summary.id,
        title: summary.title,
        keyHighlights: summary.keyHighlights,
        actionItems: summary.actionItems,
        insights: summary.insights,
        generatedAt: summary.generatedAt,
        timeRange: {
          start: summary.timeRangeStart,
          end: summary.timeRangeEnd,
        },
        metadata: summary.metadata,
      })),
      count: summaries.length,
      autoGenerated: false,
    });
  } catch (error) {
    console.error('Error fetching AI summaries:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch AI summaries',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { timeRange = '24h', forceRegenerate = false } = body;

    // Calculate time range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Check if we already have a recent summary (unless force regenerate)
    if (!forceRegenerate) {
      const existingSummary = await prisma.aISummary.findFirst({
        where: {
          userId,
          timeRangeStart: {
            gte: startDate,
          },
          generatedAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Within last 24 hours
          },
        },
        orderBy: {
          generatedAt: 'desc',
        },
      });

      if (existingSummary) {
        return NextResponse.json({
          summary: {
            id: existingSummary.id,
            title: existingSummary.title,
            keyHighlights: existingSummary.keyHighlights,
            actionItems: existingSummary.actionItems,
            insights: existingSummary.insights,
            generatedAt: existingSummary.generatedAt,
            timeRange: {
              start: existingSummary.timeRangeStart,
              end: existingSummary.timeRangeEnd,
            },
            metadata: existingSummary.metadata,
          },
          cached: true,
        });
      }
    }

    // Validate OpenRouter connection
    const isConnected = await AISummaryService.validateConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          error:
            'AI service is not available. Please check your OpenRouter API key.',
        },
        { status: 503 }
      );
    }

    // Get activities for the time range
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100, // Limit to prevent token overflow
    });

    if (activities.length === 0) {
      return NextResponse.json(
        { error: 'No activities found for the specified time range' },
        { status: 404 }
      );
    }

    // Get team context
    const [repositories, channels] = await Promise.all([
      prisma.selectedRepository.findMany({
        where: { userId },
        select: { repoName: true },
      }),
      prisma.selectedChannel.findMany({
        where: { userId },
        select: { channelName: true },
      }),
    ]);

    // Prepare data for AI summary
    const summaryData: AISummaryData = {
      activities: activities.map(activity => ({
        id: activity.id,
        source: activity.source,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        externalId: activity.externalId,
        metadata: activity.metadata,
      })) as Activity[],
      timeRange: {
        start: startDate,
        end: now,
      },
      teamContext: {
        repositories: repositories.map(r => r.repoName),
        channels: channels.map(c => c.channelName),
        teamSize: 1, // For now, single user
      },
    };

    // Generate AI summary
    const aiSummary = await AISummaryService.generateSummary(
      userId,
      summaryData
    );

    // Save to database
    const savedSummary = await prisma.aISummary.create({
      data: {
        userId,
        title: aiSummary.title,
        keyHighlights: aiSummary.keyHighlights,
        actionItems: aiSummary.actionItems,
        insights: aiSummary.insights,
        generatedAt: aiSummary.generatedAt,
        timeRangeStart: aiSummary.timeRange.start,
        timeRangeEnd: aiSummary.timeRange.end,
        metadata: aiSummary.metadata,
      },
    });

    return NextResponse.json({
      summary: {
        id: savedSummary.id,
        title: savedSummary.title,
        keyHighlights: savedSummary.keyHighlights,
        actionItems: savedSummary.actionItems,
        insights: savedSummary.insights,
        generatedAt: savedSummary.generatedAt,
        timeRange: {
          start: savedSummary.timeRangeStart,
          end: savedSummary.timeRangeEnd,
        },
        metadata: savedSummary.metadata,
      },
      cached: false,
    });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate AI summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
