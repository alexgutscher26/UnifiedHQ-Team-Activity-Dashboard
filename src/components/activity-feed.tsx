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
  IconWifi,
  IconWifiOff,
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

const getActivityIcon = (activity: Activity) => {
  if (activity.source === 'github') {
    const eventType = activity.metadata?.eventType;
    switch (eventType) {
      case 'commit':
        return IconGitCommit;
      case 'pull_request':
        return IconTag;
      case 'issue':
        return IconBug;
      default:
        return IconBrandGithub;
    }
  }

  switch (activity.source) {
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

const getActivityColor = (activity: Activity) => {
  if (activity.source === 'github') {
    const eventType = activity.metadata?.eventType;
    switch (eventType) {
      case 'commit':
        return 'text-green-600';
      case 'pull_request':
        return 'text-blue-600';
      case 'issue':
        return 'text-orange-600';
      default:
        return 'text-gray-900';
    }
  }

  switch (activity.source) {
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

/**
 * Render the activity feed component that displays recent activities from connected integrations.
 *
 * This component manages the state of activities, loading status, and live updates through EventSource.
 * It fetches activities from the server, handles live updates, and provides a refresh mechanism.
 * The component also manages UI states for loading, refreshing, and displaying activity updates with appropriate fade effects.
 *
 * @returns {JSX.Element} The rendered activity feed component.
 */
export function ActivityFeed() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    fetchActivities();
    connectToLiveUpdates();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  useEffect(() => {
    // Initialize fade states when activities change
    if (activities.length > 0) {
      setShowBottomFade(true); // Show bottom fade initially if there are activities
    }
  }, [activities]);

  /**
   * Establish a connection to live updates via Server-Sent Events (SSE).
   *
   * The function creates an EventSource to listen for live updates from the server. It handles various message types, including connection confirmation, errors, heartbeat signals, and activity updates. On receiving an 'activity_update' message with a 'sync_completed' type, it triggers a fetch for activities and displays a toast notification. Error handling is implemented to manage connection issues and notify the user accordingly.
   *
   * @returns void
   * @throws Error If the connection to live updates fails.
   */
  const connectToLiveUpdates = () => {
    try {
      // Create EventSource with credentials
      const es = new EventSource('/api/test-sse', {
        withCredentials: true,
      });
      setEventSource(es);

      es.onopen = () => {
        setIsLiveConnected(true);
        console.log('✅ Connected to live updates');
      };

      es.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 SSE message received:', data.type);

          switch (data.type) {
            case 'connected':
              console.log('Live updates connected:', data.message);
              break;

            case 'error':
              console.error('SSE error:', data.message);
              toast({
                title: 'Connection Error',
                description: data.message,
                variant: 'destructive',
              });
              es.close();
              setIsLiveConnected(false);
              break;

            case 'heartbeat':
              // Keep connection alive
              break;

            case 'activity_update':
              if (data.data.type === 'sync_completed') {
                // Refresh activities when sync is completed
                fetchActivities();
                toast({
                  title: 'Live Update',
                  description: data.data.message,
                });
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      es.onerror = error => {
        console.error('❌ SSE connection error:', error);
        setIsLiveConnected(false);

        // Don't auto-reconnect on error, let user manually refresh
        toast({
          title: 'Connection Lost',
          description: 'Live updates disconnected. Please refresh the page.',
          variant: 'destructive',
        });
      };
    } catch (error) {
      console.error('Failed to connect to live updates:', error);
      setIsLiveConnected(false);
    }
  };

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtTop = scrollTop === 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

    setShowTopFade(!isAtTop);
    setShowBottomFade(!isAtBottom);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger GitHub sync using the new endpoint
      const syncResponse = await fetch('/api/integrations/github/sync', {
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
          <div className='flex items-center gap-2'>
            {/* Live connection indicator */}
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              {isLiveConnected ? (
                <>
                  <IconWifi className='size-3 text-green-500' />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <IconWifiOff className='size-3 text-red-500' />
                  <span>Offline</span>
                </>
              )}
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
          <div className='relative'>
            <div
              className='max-h-96 overflow-y-auto space-y-4 pr-2'
              onScroll={handleScroll}
            >
              {activities.map(activity => {
                const Icon = getActivityIcon(activity);
                const colorClass = getActivityColor(activity);
                const actor = activity.metadata?.actor;
                const payload = activity.metadata?.payload;

                // Get the GitHub URL for the activity
                const getGitHubUrl = () => {
                  if (activity.source === 'github' && payload) {
                    if (payload.commit?.url) return payload.commit.url;
                    if (payload.pull_request?.url)
                      return payload.pull_request.url;
                    if (payload.issue?.url) return payload.issue.url;
                  }
                  return null;
                };

                const githubUrl = getGitHubUrl();

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
                        <h4 className='font-medium text-sm'>
                          {githubUrl ? (
                            <a
                              href={githubUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='hover:underline text-blue-600 hover:text-blue-800'
                            >
                              {activity.title}
                            </a>
                          ) : (
                            activity.title
                          )}
                        </h4>
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
            {/* Gradient fade indicators */}
            {showTopFade && (
              <div className='absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent pointer-events-none' />
            )}
            {showBottomFade && (
              <div className='absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none' />
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
