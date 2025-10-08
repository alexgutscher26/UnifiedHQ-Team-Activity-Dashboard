import { useState, useEffect } from 'react';
import {
  IconBrandGithub,
  IconBrandNotion,
  IconBrandSlack,
  IconSparkles,
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

/**
 * Renders a section of cards displaying various statistics.
 *
 * The SectionCards function manages the loading state and fetches mock statistics data for Notion, Slack, GitHub, and AI summaries. It utilizes a memory leak prevention hook and a safe timer for simulating an API call delay. The component conditionally renders loading skeletons or the actual statistics cards based on the loading state.
 */
export function SectionCards() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memory leak prevention
  useMemoryLeakPrevention('SectionCards');
  const { setTimeout, clearTimeout } = useSafeTimer();

  const loadStats = async () => {
    try {
      // Simulate API call delay - reduced for faster loading
      await new Promise(resolve => {
        const timer = setTimeout(resolve, 50);
        return timer;
      });

      // Mock stats data
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
          count: 18,
          status: 'Active',
          details: '7 commits, 3 PRs, 2 reviews',
          lastUpdate: '15 minutes ago',
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
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
