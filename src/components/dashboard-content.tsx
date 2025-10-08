'use client';

import React, { useState } from 'react';
import { ActivityFeed } from '@/components/activity-feed';
import { AISummary } from '@/components/ai-summary';
import { SectionCards } from '@/components/section-cards';
import {
  ActivityFeedErrorBoundary,
  GitHubErrorBoundary,
} from '@/components/error-boundaries';
import { LoadingState, LoadingCard } from '@/components/ui/loading';
import { useLoading } from '@/hooks/use-loading';
import { Repository } from '@/lib/github';
import { loadUserPreferences } from '@/lib/user-preferences';
import {
  useMemoryLeakPrevention,
  useSafeFetch,
  useSafeTimer,
} from '@/lib/memory-leak-prevention';

/**
 * Renders the dashboard content, managing GitHub connection status and user preferences.
 *
 * The function initializes state for the selected repository, GitHub connection status, and initialization status.
 * It checks the GitHub connection status on mount and loads user preferences, creating a repository object if available.
 * The loading state is managed to prevent memory leaks and ensure a responsive UI.
 * If initialization is not complete, loading indicators are displayed; otherwise, the main dashboard content is rendered.
 *
 * @returns {JSX.Element} The rendered dashboard content.
 */
export function DashboardContent() {
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memory leak prevention
  useMemoryLeakPrevention('DashboardContent');
  const { setTimeout, clearTimeout } = useSafeTimer();

  // Check GitHub connection status on mount
  const checkGitHubStatus = async () => {
    try {
      const response = await fetch('/api/github/status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsGitHubConnected(data.success && data.connected);
      }
    } catch (error) {
      console.error('Error checking GitHub status:', error);
      // Set to false on error to prevent hanging
      setIsGitHubConnected(false);
    }
  };

  // Load GitHub status and saved repository on mount
  React.useEffect(() => {
    /**
     * Load data asynchronously, including GitHub status and user preferences.
     *
     * The function sets a timeout to prevent hanging during the loading process. It runs both the GitHub status check and user preferences loading in parallel, handling any errors gracefully. If valid preferences are retrieved, it creates a repository object and updates the selected repository. In case of an error, it logs the error and sets default values.
     *
     * @returns {Promise<void>} A promise that resolves when the data loading is complete.
     */
    const loadData = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          const timer = setTimeout(
            () => reject(new Error('Loading timeout')),
            3000
          );
          return timer;
        });

        // Run both operations in parallel for faster loading
        const [githubStatus, preferences] = (await Promise.race([
          Promise.all([
            checkGitHubStatus(),
            loadUserPreferences().catch(() => null), // Don't fail if preferences can't be loaded
          ]),
          timeoutPromise,
        ])) as [any, any];

        if (
          preferences?.githubRepoId &&
          preferences?.githubOwner &&
          preferences?.githubRepo
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
        console.error('Error loading data:', error);
        // Set default values on error
        setIsGitHubConnected(false);
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();
  }, []);

  if (!isInitialized) {
    return (
      <div className='flex flex-1 flex-col'>
        <div className='@container/main flex flex-1 flex-col gap-2'>
          <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
            <LoadingCard className='mx-4 lg:mx-6' />
            <div className='grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:gap-6 lg:px-6'>
              <div className='lg:col-span-2'>
                <LoadingCard />
              </div>
              <div className='lg:col-span-1'>
                <LoadingCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
