import { useState, useEffect } from 'react';
import {
  IconBrandGithub,
  IconBrandNotion,
  IconBrandSlack,
  IconSparkles,
  IconWifi,
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingState, LoadingSkeleton } from '@/components/ui/loading';
import { useLoading } from '@/hooks/use-loading';
import {
  useMemoryLeakPrevention,
  useSafeTimer,
} from '@/lib/memory-leak-prevention';

export function SectionCards() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');

  // Memory leak prevention
  useMemoryLeakPrevention('SectionCards');
  const { setTimeout, clearTimeout } = useSafeTimer();

  const loadStats = async () => {
    try {
      // Fetch real GitHub statistics
      const githubResponse = await fetch('/api/github/stats');
      const githubStats = githubResponse.ok
        ? await githubResponse.json()
        : {
            count: 0,
            status: 'Inactive',
            details: 'No activity',
            lastUpdate: 'No recent activity',
          };

      // Mock stats data for other services (Notion, Slack, AI)
      setStats({
        notion: {
          count: 24,
          status: 'Active',
          details: '12 pages edited, 8 comments',
          lastUpdate: '5 minutes ago',
        },
        slack: {
          count: 156,
          status: 'Active',
          details: '8 channels, 23 threads',
          lastUpdate: '2 minutes ago',
        },
        github: {
          count: githubStats.count,
          status: githubStats.status,
          details: githubStats.details,
          lastUpdate: githubStats.lastUpdate,
        },
        ai: {
          count: 'Ready',
          status: 'Generated',
          details: 'Daily insights available',
          lastUpdate: '10 minutes ago',
        },
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to mock data on error
      setStats({
        notion: {
          count: 24,
          status: 'Active',
          details: '12 pages edited, 8 comments',
          lastUpdate: '5 minutes ago',
        },
        slack: {
          count: 156,
          status: 'Active',
          details: '8 channels, 23 threads',
          lastUpdate: '2 minutes ago',
        },
        github: {
          count: 0,
          status: 'Inactive',
          details: 'No activity',
          lastUpdate: 'No recent activity',
        },
        ai: {
          count: 'Ready',
          status: 'Generated',
          details: 'Daily insights available',
          lastUpdate: '10 minutes ago',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to live updates for real-time GitHub stats
  const connectToLiveUpdates = (retryCount = 0) => {
    try {
      setConnectionState('connecting');

      const es = new EventSource('/api/activities/live', {
        withCredentials: true,
      });
      setEventSource(es);

      es.onopen = () => {
        console.log('✅ SectionCards connected to live updates');
        setConnectionState('connected');
      };

      es.onmessage = event => {
        try {
          const data = JSON.parse(event.data);

          // Handle different message types
          if (data.type === 'connected') {
            console.log('📡 SSE connection established');
            setConnectionState('connected');
          } else if (data.type === 'heartbeat') {
            // Silently handle heartbeats
            return;
          } else if (
            data.type === 'activity_update' &&
            data.data?.type === 'sync_completed'
          ) {
            // Refresh GitHub stats when sync is completed
            console.log('🔄 Refreshing GitHub stats after sync');
            loadStats();
          } else if (data.type === 'error') {
            console.warn('⚠️ SSE error message:', data.message);
            setConnectionState('error');
            // Don't treat error messages as connection failures
          }
        } catch (error) {
          console.error('Error parsing SSE message in SectionCards:', error);
        }
      };

      es.onerror = error => {
        // More detailed error logging
        console.warn('⚠️ SectionCards SSE connection issue:', {
          readyState: es.readyState,
          url: es.url,
          error: error,
          retryCount,
        });

        setConnectionState('disconnected');

        // Only log as error if it's a critical failure
        if (es.readyState === EventSource.CLOSED) {
          console.error('❌ SectionCards SSE connection closed');

          // Retry connection after a delay (max 3 retries)
          if (retryCount < 3) {
            console.log(
              `🔄 Retrying SSE connection (attempt ${retryCount + 1}/3)`
            );
            setTimeout(
              () => {
                connectToLiveUpdates(retryCount + 1);
              },
              Math.pow(2, retryCount) * 1000
            ); // Exponential backoff: 1s, 2s, 4s
          } else {
            console.error('❌ Max SSE retry attempts reached');
            setConnectionState('error');
          }
        }
      };
    } catch (error) {
      console.error('Failed to create SSE connection in SectionCards:', error);
      setConnectionState('error');
    }
  };

  useEffect(() => {
    loadStats();
    connectToLiveUpdates();

    // Set up periodic refresh every 2 minutes for GitHub stats
    const interval = setTimeout(() => {
      console.log('🔄 Periodic GitHub stats refresh');
      loadStats();
    }, 120000); // 2 minutes

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (interval) {
        clearTimeout(interval);
      }
    };
  }, []);

  const LoadingCard = () => (
    <Card className='@container/card'>
      <CardHeader>
        <CardDescription className='flex items-center gap-2'>
          <LoadingSkeleton className='h-4 w-4' />
          <LoadingSkeleton className='h-4 w-20' />
        </CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          <LoadingSkeleton className='h-8 w-12' />
        </CardTitle>
        <CardAction>
          <LoadingSkeleton className='h-6 w-16' />
        </CardAction>
      </CardHeader>
      <CardFooter className='flex-col items-start gap-1.5 text-sm'>
        <LoadingSkeleton className='h-4 w-32' />
        <LoadingSkeleton className='h-3 w-24' />
      </CardFooter>
    </Card>
  );

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      {isLoading ? (
        <>
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </>
      ) : (
        stats && (
          <>
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription className='flex items-center gap-2'>
                  <IconBrandNotion className='size-4' />
                  Notion Updates
                </CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {stats.notion.count}
                </CardTitle>
                <CardAction>
                  <Badge variant='outline' className='bg-background'>
                    {stats.notion.status}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 font-medium'>
                  {stats.notion.details}
                </div>
                <div className='text-muted-foreground'>
                  Last update {stats.notion.lastUpdate}
                </div>
              </CardFooter>
            </Card>
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription className='flex items-center gap-2'>
                  <IconBrandSlack className='size-4' />
                  Slack Messages
                </CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {stats.slack.count}
                </CardTitle>
                <CardAction>
                  <Badge variant='outline' className='bg-background'>
                    {stats.slack.status}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 font-medium'>
                  {stats.slack.details}
                </div>
                <div className='text-muted-foreground'>
                  Last message {stats.slack.lastUpdate}
                </div>
              </CardFooter>
            </Card>
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription className='flex items-center gap-2'>
                  <IconBrandGithub className='size-4' />
                  GitHub Activity
                  {connectionState === 'connected' && (
                    <IconWifi
                      className='size-3 text-green-500'
                      title='Live updates active'
                    />
                  )}
                  {connectionState === 'connecting' && (
                    <div
                      className='size-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'
                      title='Connecting...'
                    />
                  )}
                  {connectionState === 'error' && (
                    <div
                      className='size-3 rounded-full bg-red-500'
                      title='Connection failed'
                    />
                  )}
                </CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {stats.github.count}
                </CardTitle>
                <CardAction>
                  <Badge variant='outline' className='bg-background'>
                    {stats.github.status}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 font-medium'>
                  {stats.github.details}
                </div>
                <div className='text-muted-foreground'>
                  Last commit {stats.github.lastUpdate}
                </div>
              </CardFooter>
            </Card>
            <Card className='@container/card'>
              <CardHeader>
                <CardDescription className='flex items-center gap-2'>
                  <IconSparkles className='size-4' />
                  AI Summary
                </CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {stats.ai.count}
                </CardTitle>
                <CardAction>
                  <Badge variant='outline' className='bg-background'>
                    {stats.ai.status}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 font-medium'>
                  {stats.ai.details}
                </div>
                <div className='text-muted-foreground'>
                  Updated {stats.ai.lastUpdate}
                </div>
              </CardFooter>
            </Card>
          </>
        )
      )}
    </div>
  );
}
