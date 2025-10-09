import { NextRequest, NextResponse } from 'next/server';
import { GitHubCacheManager } from '@/lib/integrations/github-cached';

/**
 * Cache cleanup endpoint - can be called by cron jobs
 * Clears expired cache entries to prevent database bloat
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cache Cleanup] Starting cache cleanup...');

    // Clear expired database cache entries
    await GitHubCacheManager.clearDatabaseCache();

    // Get cache statistics after cleanup
    const stats = GitHubCacheManager.getStats();

    console.log('[Cache Cleanup] Cache cleanup completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Cache cleanup completed',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cache Cleanup] Error during cache cleanup:', error);
    return NextResponse.json(
      {
        error: 'Cache cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get cache statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = GitHubCacheManager.getStats();

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cache Stats] Error getting cache stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to get cache statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
