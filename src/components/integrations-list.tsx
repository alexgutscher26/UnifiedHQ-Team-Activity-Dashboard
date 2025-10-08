'use client';

import { useState, useEffect } from 'react';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import {
  IconBrandGithub,
  IconBrandNotion,
  IconBrandSlack,
} from '@tabler/icons-react';

interface Integration {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  onClick?: () => void;
}

export function IntegrationsList() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      title: 'Notion',
      icon: IconBrandNotion,
      connected: false,
    },
    {
      title: 'Slack',
      icon: IconBrandSlack,
      connected: false,
    },
    {
      title: 'GitHub',
      icon: IconBrandGithub,
      connected: false,
    },
  ]);

  // Listen for GitHub connection changes
  useEffect(() => {
    const handleStorageChange = () => {
      checkGitHubConnection();
    };

    // Listen for custom events or storage changes
    window.addEventListener('github-connection-changed', handleStorageChange);
    return () =>
      window.removeEventListener(
        'github-connection-changed',
        handleStorageChange
      );
  }, []);

  const checkGitHubConnection = async () => {
    try {
      const response = await fetch('/api/github/status');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(prev =>
          prev.map(integration =>
            integration.title === 'GitHub'
              ? { ...integration, connected: data.success && data.connected }
              : integration
          )
        );
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
    }
  };

  useEffect(() => {
    checkGitHubConnection();
  }, []);

  const handleIntegrationClick = (integration: Integration) => {
    // Navigate to integrations page
    window.location.href = '/integrations';
  };

  return (
    <div className='space-y-1'>
      {integrations.map(integration => (
        <SidebarMenuButton
          key={integration.title}
          asChild
          onClick={() => handleIntegrationClick(integration)}
        >
          <a
            href='#'
            className='flex items-center gap-3 cursor-pointer'
            onClick={e => {
              e.preventDefault();
              handleIntegrationClick(integration);
            }}
          >
            <integration.icon className='size-4' />
            <span>{integration.title}</span>
            <div
              className={`ml-auto size-2 rounded-full ${
                integration.connected ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          </a>
        </SidebarMenuButton>
      ))}
    </div>
  );
}
