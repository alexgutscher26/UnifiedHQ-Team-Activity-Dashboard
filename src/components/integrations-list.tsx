'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import {
  IconBrandGithub,
  IconBrandNotion,
  IconBrandSlack,
  IconPlus,
} from '@tabler/icons-react';

interface Integration {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  status: 'connected' | 'disconnected' | 'coming-soon';
  description?: string;
}

export function IntegrationsList() {
  const router = useRouter();
  const [integrations] = useState<Integration[]>([
    {
      id: 'notion',
      title: 'Notion',
      icon: IconBrandNotion,
      connected: false,
      status: 'coming-soon',
    },
    {
      id: 'slack',
      title: 'Slack',
      icon: IconBrandSlack,
      connected: false,
      status: 'coming-soon',
    },
    {
      id: 'github',
      title: 'GitHub',
      icon: IconBrandGithub,
      connected: false,
      status: 'coming-soon',
    },
  ]);

  const handleIntegrationClick = (integration: Integration) => {
    // Navigate to integrations page
    router.push('/integrations');
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-gray-300';
      case 'coming-soon':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusText = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'coming-soon':
        return 'Coming Soon';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className='space-y-1'>
      {integrations.map(integration => (
        <SidebarMenuButton
          key={integration.id}
          asChild
          onClick={() => handleIntegrationClick(integration)}
          className='group relative cursor-pointer'
        >
          <button
            className='flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-accent transition-colors cursor-pointer'
            onClick={() => handleIntegrationClick(integration)}
          >
            <div className='flex-shrink-0'>
              <integration.icon className='size-4 text-muted-foreground group-hover:text-foreground transition-colors' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium truncate'>
                  {integration.title}
                </span>
                <div className='flex items-center gap-2'>
                  <div
                    className={`size-2 rounded-full ${getStatusColor(integration.status)}`}
                    title={getStatusText(integration.status)}
                  />
                </div>
              </div>
              {integration.description && (
                <p className='text-xs text-muted-foreground truncate mt-0.5'>
                  {integration.description}
                </p>
              )}
            </div>
          </button>
        </SidebarMenuButton>
      ))}

      {/* Add Integration Button */}
      <SidebarMenuButton
        asChild
        onClick={() => router.push('/integrations')}
        className='group relative cursor-pointer'
      >
        <button
          className='flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-accent transition-colors border-t pt-3 mt-2 cursor-pointer'
          onClick={() => router.push('/integrations')}
        >
          <div className='flex-shrink-0'>
            <IconPlus className='size-4 text-muted-foreground group-hover:text-foreground transition-colors' />
          </div>
          <span className='text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors'>
            Add Integration
          </span>
        </button>
      </SidebarMenuButton>
    </div>
  );
}
