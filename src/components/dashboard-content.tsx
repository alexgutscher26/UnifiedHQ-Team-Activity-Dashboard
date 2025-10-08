'use client';

import React, { useState } from 'react';
import { ActivityFeed } from '@/components/activity-feed';
import { AISummary } from '@/components/ai-summary';
import { SectionCards } from '@/components/section-cards';
import {
  ActivityFeedErrorBoundary,
  GitHubErrorBoundary,
} from '@/components/error-boundaries';
import { Repository } from '@/lib/github';
import { loadUserPreferences } from '@/lib/user-preferences';

export function DashboardContent() {
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);

  // Check GitHub connection status on mount
  const checkGitHubStatus = async () => {
    try {
      const response = await fetch('/api/github/status');
      if (response.ok) {
        const data = await response.json();
        setIsGitHubConnected(data.success && data.connected);
      }
    } catch (error) {
      console.error('Error checking GitHub status:', error);
    }
  };

  // Load GitHub status and saved repository on mount
  React.useEffect(() => {
    const loadData = async () => {
      await checkGitHubStatus();

      // Load saved repository preferences
      try {
        const preferences = await loadUserPreferences();
        if (
          preferences.githubRepoId &&
          preferences.githubOwner &&
          preferences.githubRepo
        ) {
          // Create a repository object from saved preferences
          const savedRepo: Repository = {
            id: preferences.githubRepoId,
            name: preferences.githubRepo,
            fullName: `${preferences.githubOwner}/${preferences.githubRepo}`,
            owner: preferences.githubOwner,
            description: null,
            isPrivate: false,
            updatedAt: new Date().toISOString(),
            defaultBranch: 'main',
          };
          setSelectedRepository(savedRepo);
        }
      } catch (error) {
        console.error('Error loading saved repository:', error);
      }
    };

    loadData();
  }, []);

  return (
    <div className='flex flex-1 flex-col'>
      <div className='@container/main flex flex-1 flex-col gap-2'>
        <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
          <GitHubErrorBoundary>
            <SectionCards />
          </GitHubErrorBoundary>
          <div className='grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:gap-6 lg:px-6'>
            <div className='lg:col-span-2'>
              <ActivityFeedErrorBoundary>
                <ActivityFeed selectedRepository={selectedRepository} />
              </ActivityFeedErrorBoundary>
            </div>
            <div className='lg:col-span-1'>
              <GitHubErrorBoundary>
                <AISummary />
              </GitHubErrorBoundary>
            </div>
          </div>
          {/* Integration components moved to /integrations page */}
        </div>
      </div>
    </div>
  );
}
