import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import {
  isSlackConnected,
  getSelectedChannelCount,
} from '@/lib/integrations/slack-cached';

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

    // Check if Slack is connected
    const connected = await isSlackConnected(userId);

    if (!connected) {
      return NextResponse.json({
        connected: false,
        selectedChannels: 0,
        storedActivities: 0,
        message: 'Slack not connected',
      });
    }

    // Get selected channel count
    const selectedChannelCount = await getSelectedChannelCount(userId);

    // Get stored Slack activities count
    const storedActivities = await prisma.activity.count({
      where: {
        userId,
        source: 'slack',
      },
    });

    // Get connection info
    const connection = await prisma.connection.findFirst({
      where: {
        userId,
        type: 'slack',
      },
    });

    return NextResponse.json({
      connected: true,
      selectedChannels: selectedChannelCount,
      storedActivities,
      teamName: connection?.teamName,
      teamId: connection?.teamId,
      lastSync: connection?.updatedAt,
      message: `Slack connected to ${connection?.teamName || 'workspace'}`,
    });
  } catch (error) {
    console.error('Slack debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
