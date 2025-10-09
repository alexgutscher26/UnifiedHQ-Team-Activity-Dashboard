'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { RepositorySelector } from '@/components/repository-selector';
import {
  IconBrandNotion,
  IconBrandSlack,
  IconBrandGithub,
  IconCheck,
  IconLoader2,
  IconRefresh,
  IconSettings,
  IconExternalLink,
  IconAlertCircle,
  IconInfoCircle,
  IconTrendingUp,
  IconClock,
  IconDatabase,
  IconShield,
  IconSparkles,
  IconRocket,
} from '@tabler/icons-react';

export function IntegrationsPage() {
  const { toast } = useToast();
  const [githubConnected, setGithubConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  // Check GitHub connection status on mount
  useEffect(() => {
    checkGithubStatus();
    fetchStats();
  }, []);

  const checkGithubStatus = async () => {
    try {
      const response = await fetch('/api/github/sync');
      const data = await response.json();
      setGithubConnected(data.connected);
    } catch (error) {
      console.error('Failed to check GitHub status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/debug/github-sync');
      const data = await response.json();
      if (response.ok) {
        setSelectedRepos(data.selectedRepositories || 0);
        setTotalActivities(data.storedActivities || 0);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleGithubConnect = async () => {
    setIsLoading(true);
    try {
      window.location.href = '/api/integrations/github/connect';
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect to GitHub. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/integrations/github/sync', {
        method: 'POST',
      });
      const data = await response.json();

      clearInterval(progressInterval);
      setSyncProgress(100);

      if (response.ok) {
        setLastSyncTime(new Date());
        await fetchStats(); // Refresh stats after sync
        toast({
          title: 'Sync Successful',
          description: data.message,
        });
      } else {
        if (data.code === 'TOKEN_EXPIRED') {
          setGithubConnected(false);
          toast({
            title: 'GitHub Token Expired',
            description: 'Please reconnect your GitHub account.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sync Failed',
            description: data.error || 'Failed to sync GitHub activity',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync GitHub activity. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncProgress(0), 1000);
    }
  };

  const handleGithubDisconnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/github/disconnect', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setGithubConnected(false);
        toast({
          title: 'Success',
          description: data.message,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to disconnect GitHub',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect GitHub. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const integrations = [
    {
      id: 'github',
      name: 'GitHub',
      description:
        'Track commits, pull requests, issues, and repository activity',
      icon: IconBrandGithub,
      connected: githubConnected,
      color: 'bg-gray-900',
      gradient: 'from-gray-800 to-gray-900',
      status: githubConnected ? 'Connected' : 'Available',
      statusColor: githubConnected ? 'bg-green-500' : 'bg-blue-500',
      features: ['Commits', 'Pull Requests', 'Issues', 'Repository Events'],
      stats: githubConnected
        ? {
            repositories: selectedRepos,
            activities: totalActivities,
            lastSync: lastSyncTime,
          }
        : null,
      action: githubConnected ? (
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2'>
            <RepositorySelector isConnected={githubConnected} />
            <Button
              size='sm'
              variant='outline'
              onClick={handleGithubSync}
              disabled={isSyncing}
              className='flex-1'
            >
              {isSyncing ? (
                <IconLoader2 className='size-4 mr-2 animate-spin' />
              ) : (
                <IconRefresh className='size-4 mr-2' />
              )}
              Sync Now
            </Button>
          </div>
          {isSyncing && (
            <div className='space-y-2'>
              <Progress value={syncProgress} className='h-2' />
              <p className='text-xs text-muted-foreground text-center'>
                Syncing activities...
              </p>
            </div>
          )}
          <Button
            size='sm'
            variant='destructive'
            onClick={handleGithubDisconnect}
            disabled={isLoading}
            className='w-full'
          >
            {isLoading ? (
              <IconLoader2 className='size-4 mr-2 animate-spin' />
            ) : null}
            Disconnect
          </Button>
        </div>
      ) : (
        <Button
          size='sm'
          onClick={handleGithubConnect}
          disabled={isLoading}
          className='w-full'
        >
          {isLoading ? (
            <IconLoader2 className='size-4 mr-2 animate-spin' />
          ) : (
            <IconRocket className='size-4 mr-2' />
          )}
          Connect GitHub
        </Button>
      ),
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Sync your Notion pages, databases, and team updates',
      icon: IconBrandNotion,
      connected: false,
      color: 'bg-black',
      gradient: 'from-gray-900 to-black',
      status: 'Coming Soon',
      statusColor: 'bg-yellow-500',
      features: ['Pages', 'Databases', 'Team Updates', 'Comments'],
      comingSoon: true,
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Track team messages, channels, and collaboration activity',
      icon: IconBrandSlack,
      connected: false,
      color: 'bg-purple-600',
      gradient: 'from-purple-600 to-purple-700',
      status: 'Coming Soon',
      statusColor: 'bg-yellow-500',
      features: ['Messages', 'Channels', 'Files', 'Reactions'],
      comingSoon: true,
    },
  ];

  return (
    <div className='flex flex-1 flex-col'>
      <div className='@container/main flex flex-1 flex-col gap-2'>
        <div className='flex flex-col gap-6 py-4 md:gap-8 md:py-6'>
          {/* Header */}
          <div className='px-4 lg:px-6'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <h1 className='text-3xl font-bold flex items-center gap-2'>
                  <IconSparkles className='size-8 text-primary' />
                  Integrations
                </h1>
                <p className='text-muted-foreground text-lg'>
                  Connect your favorite tools to get a unified view of your
                  team&apos;s activity
                </p>
              </div>

              {/* Quick Stats */}
              {githubConnected && (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <Card className='bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'>
                    <CardContent className='p-4'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-green-100 rounded-lg'>
                          <IconDatabase className='size-5 text-green-600' />
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>
                            Repositories
                          </p>
                          <p className='text-2xl font-bold text-green-700'>
                            {selectedRepos}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'>
                    <CardContent className='p-4'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-blue-100 rounded-lg'>
                          <IconTrendingUp className='size-5 text-blue-600' />
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>
                            Activities
                          </p>
                          <p className='text-2xl font-bold text-blue-700'>
                            {totalActivities}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200'>
                    <CardContent className='p-4'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-purple-100 rounded-lg'>
                          <IconClock className='size-5 text-purple-600' />
                        </div>
                        <div>
                          <p className='text-sm text-muted-foreground'>
                            Last Sync
                          </p>
                          <p className='text-sm font-medium text-purple-700'>
                            {lastSyncTime
                              ? lastSyncTime.toLocaleTimeString()
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Integration Cards */}
          <div className='px-4 lg:px-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
              {integrations.map(integration => (
                <Card
                  key={integration.id}
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                    integration.connected
                      ? 'ring-2 ring-green-200 bg-green-50/30'
                      : ''
                  } ${integration.comingSoon ? 'opacity-75' : ''}`}
                >
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${integration.gradient} opacity-5`}
                  />

                  <CardHeader className='relative'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`p-3 rounded-xl ${integration.color} shadow-lg`}
                        >
                          <integration.icon className='size-6 text-white' />
                        </div>
                        <div>
                          <CardTitle className='text-xl flex items-center gap-2'>
                            {integration.name}
                            {integration.comingSoon && (
                              <Badge variant='secondary' className='text-xs'>
                                Coming Soon
                              </Badge>
                            )}
                          </CardTitle>
                          <div className='flex items-center gap-2 mt-1'>
                            <div
                              className={`size-2 rounded-full ${integration.statusColor}`}
                            />
                            <span className='text-sm text-muted-foreground'>
                              {integration.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {integration.connected && (
                        <Badge
                          variant='secondary'
                          className='bg-green-100 text-green-800'
                        >
                          <IconCheck className='size-3 mr-1' />
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className='relative space-y-4'>
                    <CardDescription className='text-sm leading-relaxed'>
                      {integration.description}
                    </CardDescription>

                    {/* Features */}
                    <div className='space-y-2'>
                      <h4 className='text-sm font-medium text-muted-foreground'>
                        Features:
                      </h4>
                      <div className='flex flex-wrap gap-1'>
                        {integration.features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant='outline'
                            className='text-xs'
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Stats for connected integrations */}
                    {integration.stats && (
                      <div className='space-y-2'>
                        <Separator />
                        <div className='grid grid-cols-2 gap-2 text-sm'>
                          <div className='flex items-center gap-2'>
                            <IconDatabase className='size-4 text-muted-foreground' />
                            <span className='text-muted-foreground'>
                              Repos:
                            </span>
                            <span className='font-medium'>
                              {integration.stats.repositories}
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <IconTrendingUp className='size-4 text-muted-foreground' />
                            <span className='text-muted-foreground'>
                              Activities:
                            </span>
                            <span className='font-medium'>
                              {integration.stats.activities}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className='pt-2'>{integration.action}</div>

                    {/* Coming Soon Notice */}
                    {integration.comingSoon && (
                      <Alert>
                        <IconInfoCircle className='size-4' />
                        <AlertDescription className='text-sm'>
                          This integration is in development. Stay tuned for
                          updates!
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className='px-4 lg:px-6'>
            <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
              <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <div className='p-2 bg-blue-100 rounded-lg'>
                    <IconShield className='size-6 text-blue-600' />
                  </div>
                  <div className='space-y-2'>
                    <h3 className='text-lg font-semibold text-blue-900'>
                      Need Help?
                    </h3>
                    <p className='text-blue-700'>
                      Having trouble with integrations? Check out our debug page
                      for detailed information about your connections and sync
                      status.
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      asChild
                      className='mt-2'
                    >
                      <a href='/debug' className='flex items-center gap-2'>
                        <IconSettings className='size-4' />
                        Debug Center
                        <IconExternalLink className='size-4' />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
