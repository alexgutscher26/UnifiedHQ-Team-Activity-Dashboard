'use client';

import { useState, useEffect } from 'react';
import {
  IconBrandNotion,
  IconBrandSlack,
  IconBrandGithub,
  IconBug,
  IconTag,
  IconStar,
  IconGitCommit,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRealTime } from '@/hooks/use-realtime';

interface Activity {
  id: string;
  source: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  externalId?: string;
  metadata?: any;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'notion':
      return IconBrandNotion;
    case 'slack':
      return IconBrandSlack;
    case 'github':
      return IconBrandGithub;
    default:
      return IconGitCommit;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'notion':
      return 'text-black';
    case 'slack':
      return 'text-purple-600';
    case 'github':
      return 'text-gray-900';
    default:
      return 'text-gray-600';
  }
};

const formatTimestamp = (timestamp: Date | string) => {
  const now = new Date();
  const timestampDate =
    timestamp instanceof Date ? timestamp : new Date(timestamp);
  const diffInHours = Math.floor(
    (now.getTime() - timestampDate.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
};

export function ActivityFeed() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  // Set up real-time updates
  const { isActive } = useRealTime({
    interval: 30000, // 30 seconds
    enabled: realTimeEnabled,
    onUpdate: () => fetchActivities(true), // Silent refresh
  });

  const fetchActivities = async (silent = false) => {
    try {
      const response = await fetch('/api/activities');
      if (response.ok) {
        const data = await response.json();
        const newActivities = data.activities || [];

        // Check if there are new activities
        if (!silent && activities.length > 0) {
          const hasNewActivities = newActivities.some(
            newActivity =>
              !activities.some(
                existingActivity => existingActivity.id === newActivity.id
              )
          );

          if (hasNewActivities) {
            toast({
              title: 'New Activity',
              description: 'New activities have been detected!',
              duration: 3000,
            });
          }
        }

        setActivities(newActivities);
        setLastSyncTime(new Date());
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger GitHub sync
      const syncResponse = await fetch('/api/github/sync', {
        method: 'POST',
      });

      if (syncResponse.ok) {
        // Refresh activities after sync
        await fetchActivities();
        setLastSyncTime(new Date());
        toast({
          title: 'Success',
          description: 'Activities refreshed successfully',
        });
      } else {
        const errorData = await syncResponse.json();
        if (errorData.code === 'TOKEN_EXPIRED') {
          toast({
            title: 'GitHub Token Expired',
            description:
              'Please reconnect your GitHub account in Settings > Integrations',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: errorData.error || 'Failed to refresh activities',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh activities',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconGitCommit className='size-5' />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest updates from your connected integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className='flex items-start gap-3 p-3 rounded-lg border bg-card'
              >
                <Skeleton className='size-8 rounded-lg' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                  <Skeleton className='h-3 w-1/4' />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <IconGitCommit className='size-5' />
              Recent Activity
              <div className='flex items-center gap-1 ml-2'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}
                  title={
                    isActive
                      ? 'Real-time updates active'
                      : 'Real-time updates paused'
                  }
                />
                <span className='text-xs text-muted-foreground'>
                  {isActive ? 'Live' : 'Paused'}
                </span>
              </div>
            </CardTitle>
            <CardDescription>
              Latest updates from your connected integrations
              {lastSyncTime && (
                <span className='block text-xs mt-1'>
                  Last updated: {formatTimestamp(lastSyncTime)}
                </span>
              )}
            </CardDescription>
          </div>
          <div className='flex gap-2'>
            <Button
              variant={realTimeEnabled ? 'default' : 'outline'}
              size='sm'
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            >
              {realTimeEnabled ? 'Live' : 'Paused'}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <IconLoader2 className='size-4 mr-2 animate-spin' />
              ) : (
                <IconRefresh className='size-4 mr-2' />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-muted-foreground mb-4'>
              No activity found. Make sure you've selected repositories and
              synced your GitHub data.
            </p>
            <div className='flex gap-2 justify-center'>
              <Button
                variant='outline'
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <IconLoader2 className='size-4 mr-2 animate-spin' />
                ) : (
                  <IconRefresh className='size-4 mr-2' />
                )}
                Sync Now
              </Button>
              <Button
                variant='outline'
                onClick={() => (window.location.href = '/integrations')}
              >
                Manage Repositories
              </Button>
            </div>
          </div>
        ) : (
          <div className='space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
            {activities.slice(0, 5).map(activity => {
              const Icon = getActivityIcon(activity.source);
              const colorClass = getActivityColor(activity.source);
              const actor = activity.metadata?.actor;

              return (
                <div
                  key={activity.id}
                  className='flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors'
                >
                  <div className={`p-2 rounded-lg bg-muted ${colorClass}`}>
                    <Icon className='size-4' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <h4 className='font-medium text-sm'>{activity.title}</h4>
                      <Badge variant='secondary' className='text-xs'>
                        {activity.source}
                      </Badge>
                    </div>
                    {activity.description && (
                      <p className='text-sm text-muted-foreground mb-2'>
                        {activity.description}
                      </p>
                    )}
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      {actor && (
                        <>
                          <Avatar className='size-4'>
                            <AvatarImage src={actor.avatar_url} />
                            <AvatarFallback>
                              {actor.login?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{actor.display_login || actor.login}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {activities.length > 5 && (
              <div className='text-center text-xs text-muted-foreground pt-2 border-t'>
                Showing 5 of {activities.length} activities
              </div>
            )}
          </div>
        )}

        <div className='mt-6 pt-4 border-t'>
          <p className='text-sm text-muted-foreground text-center mb-4'>
            Connect more integrations to see activity from all your tools
          </p>
          <Button
            variant='outline'
            className='w-full'
            onClick={() => (window.location.href = '/integrations')}
          >
            Manage Integrations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
