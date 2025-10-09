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
import { useToast } from '@/hooks/use-toast';
import { RepositorySelector } from '@/components/repository-selector';
import {
  IconBrandNotion,
  IconBrandSlack,
  IconBrandGithub,
  IconCheck,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react';

export function IntegrationsPage() {
  const { toast } = useToast();
  const [githubConnected, setGithubConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check GitHub connection status on mount
  useEffect(() => {
    checkGithubStatus();
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
    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
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
            title: 'Error',
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
      status: githubConnected ? 'Connected' : 'Available',
      statusColor: githubConnected ? 'bg-green-500' : 'bg-blue-500',
      action: githubConnected ? (
        <div className='flex gap-2'>
          <RepositorySelector isConnected={githubConnected} />
          <Button
            size='sm'
            variant='outline'
            onClick={handleGithubSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <IconLoader2 className='size-4 mr-2 animate-spin' />
            ) : (
              <IconRefresh className='size-4 mr-2' />
            )}
            Sync
          </Button>
          <Button
            size='sm'
            variant='destructive'
            onClick={handleGithubDisconnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <IconLoader2 className='size-4 mr-2 animate-spin' />
            ) : null}
            Disconnect
          </Button>
        </div>
      ) : (
        <Button size='sm' onClick={handleGithubConnect} disabled={isLoading}>
          {isLoading ? (
            <IconLoader2 className='size-4 mr-2 animate-spin' />
          ) : null}
          Connect
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
      status: 'Coming Soon',
      statusColor: 'bg-yellow-500',
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Track team messages, channels, and collaboration activity',
      icon: IconBrandSlack,
      connected: false,
      color: 'bg-purple-600',
      status: 'Coming Soon',
      statusColor: 'bg-yellow-500',
    },
  ];

  return (
    <div className='flex flex-1 flex-col'>
      <div className='@container/main flex flex-1 flex-col gap-2'>
        <div className='flex flex-col gap-6 py-4 md:gap-8 md:py-6'>
          {/* Header */}
          <div className='px-4 lg:px-6'>
            <div className='space-y-2'>
              <h1 className='text-3xl font-bold'>Integrations</h1>
              <p className='text-muted-foreground'>
                Connect your favorite tools to get a unified view of your team's
                activity
              </p>
            </div>
          </div>

          {/* Integration Cards */}
          <div className='px-4 lg:px-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {integrations.map(integration => (
                <Card key={integration.id} className='relative'>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className={`p-2 rounded-lg ${integration.color}`}>
                          <integration.icon className='size-5 text-white' />
                        </div>
                        <div>
                          <CardTitle className='text-lg'>
                            {integration.name}
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
                      <div className='flex items-center gap-2'>
                        {integration.connected && (
                          <Badge
                            variant='secondary'
                            className='bg-green-100 text-green-800'
                          >
                            <IconCheck className='size-3 mr-1' />
                            Active
                          </Badge>
                        )}
                        {integration.action}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className='text-sm'>
                      {integration.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
