'use client';

import { useState } from 'react';
import { GitHubConnection } from '@/components/github-connection';
import { RepositorySelector } from '@/components/repository-selector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconBrandGithub,
  IconBrandNotion,
  IconBrandSlack,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { Repository } from '@/lib/github';

export function IntegrationsPage() {
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);

  const handleConnectionUpdate = (connected: boolean) => {
    setIsGitHubConnected(connected);
    if (connected) {
      // Reset selected repository when reconnecting
      setSelectedRepository(null);
    }
  };

  const integrations = [
    {
      id: 'github',
      name: 'GitHub',
      description:
        'Connect your GitHub account to track commits, pull requests, and repository activity',
      icon: IconBrandGithub,
      connected: isGitHubConnected,
      color: 'bg-gray-900',
      status: isGitHubConnected ? 'Connected' : 'Not Connected',
      statusColor: isGitHubConnected ? 'bg-green-500' : 'bg-gray-300',
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
                  <CardContent>
                    <CardDescription className='text-sm'>
                      {integration.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* GitHub Integration Details */}
          {isGitHubConnected && (
            <div className='px-4 lg:px-6 space-y-6'>
              <div className='space-y-2'>
                <h2 className='text-2xl font-semibold'>GitHub Configuration</h2>
                <p className='text-muted-foreground'>
                  Configure your GitHub integration settings
                </p>
              </div>

              <div className='space-y-4'>
                <GitHubConnection onConnectionUpdate={handleConnectionUpdate} />
                <RepositorySelector
                  onRepositorySelect={setSelectedRepository}
                  selectedRepository={selectedRepository}
                />
              </div>
            </div>
          )}

          {/* GitHub Integration Setup */}
          {!isGitHubConnected && (
            <div className='px-4 lg:px-6'>
              <GitHubConnection onConnectionUpdate={handleConnectionUpdate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
