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

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
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
            </CardTitle>
            <CardDescription>
              Latest updates from your connected integrations
            </CardDescription>
          </div>
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
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-muted-foreground mb-4'>
              No activity found. Connect your integrations and select
              repositories to see activity here.
            </p>
            <div className='flex gap-2 justify-center'>
              <Button
                variant='outline'
                onClick={() => (window.location.href = '/integrations')}
              >
                Go to Integrations
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
          <div className='space-y-4'>
            {activities.map(activity => {
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
