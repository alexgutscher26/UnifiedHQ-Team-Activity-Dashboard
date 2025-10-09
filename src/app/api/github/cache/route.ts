import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GitHubCacheManager } from '@/lib/integrations/github-cached';

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
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = GitHubCacheManager.getStats();
        return NextResponse.json({
          memoryCache: stats,
          databaseCache: 'enabled',
          userId,
        });

      case 'clear':
        const clearType = searchParams.get('type') || 'all';

        if (clearType === 'memory') {
          GitHubCacheManager.clearMemoryCache();
        } else if (clearType === 'database') {
          await GitHubCacheManager.clearDatabaseCache();
        } else if (clearType === 'user') {
          await GitHubCacheManager.clearUserCache(userId);
        } else {
          await GitHubCacheManager.clearAllCaches(userId);
        }

        return NextResponse.json({
          message: `Cache cleared: ${clearType}`,
          userId,
        });

      default:
        return NextResponse.json(
          {
            error: 'Invalid action. Use: stats, clear',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in cache management:', error);
    return NextResponse.json(
      {
        error: 'Failed to manage cache',
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
    const { action, type } = body;

    switch (action) {
      case 'clear':
        if (type === 'memory') {
          GitHubCacheManager.clearMemoryCache();
        } else if (type === 'database') {
          await GitHubCacheManager.clearDatabaseCache();
        } else if (type === 'user') {
          await GitHubCacheManager.clearUserCache(userId);
        } else {
          await GitHubCacheManager.clearAllCaches(userId);
        }

        return NextResponse.json({
          message: `Cache cleared: ${type}`,
          userId,
        });

      default:
        return NextResponse.json(
          {
            error: 'Invalid action. Use: clear',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in cache management:', error);
    return NextResponse.json(
      {
        error: 'Failed to manage cache',
      },
      { status: 500 }
    );
  }
}
