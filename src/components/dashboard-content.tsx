'use client';

import React, { useState, useEffect } from 'react';
import { ActivityFeed } from '@/components/activity-feed';
import { AISummary } from '@/components/ai-summary';
import { SectionCards } from '@/components/section-cards';
import { GitHubConnectionPrompt } from '@/components/github-connection-prompt';
import {
  ActivityFeedErrorBoundary,
  GitHubErrorBoundary,
} from '@/components/error-boundaries';
import { LoadingState, LoadingCard } from '@/components/ui/loading';
import { useLoading } from '@/hooks/use-loading';
import { useAuthStatus } from '@/hooks/use-auth-status';
import { Repository } from '@/lib/github';
import { loadUserPreferences } from '@/lib/user-preferences';
import {
  useMemoryLeakPrevention,
  useSafeFetch,
  useSafeTimer,
} from '@/lib/memory-leak-prevention';

export function DashboardContent() {
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memory leak prevention
  useMemoryLeakPrevention('DashboardContent');
  const { setTimeout, clearTimeout } = useSafeTimer();

  // Get user's authentication status
  const {
    authStatus,
    isLoading: authLoading,
    error: authError,
    refetch: refetchAuth,
  } = useAuthStatus();

  // Load saved repository preferences when auth status is available
  useEffect(() => {
    const loadPreferences = async () => {
      if (!authStatus) return;

      try {
        const preferences = await loadUserPreferences().catch(() => null);

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
        console.error('Error loading preferences:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadPreferences();
  }, [authStatus]);

  // Show loading state while auth status is loading or data is initializing
  if (authLoading || !isInitialized) {
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

  // Show error state if auth status failed to load
  if (authError) {
    return (
      <div className='flex flex-1 flex-col'>
        <div className='@container/main flex flex-1 flex-col gap-2'>
          <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
            <div className='mx-4 lg:mx-6 p-4 border border-red-200 bg-red-50 rounded-lg'>
              <h3 className='text-red-800 font-medium'>
                Error loading dashboard
              </h3>
              <p className='text-red-600 text-sm mt-1'>{authError}</p>
              <button
                onClick={refetchAuth}
                className='mt-2 text-sm text-red-700 hover:text-red-800 underline'
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine what to show based on user's signup method and GitHub connection
  const showGitHubPrompt =
    authStatus?.signupMethod === 'email' && !authStatus?.isGitHubConnected;
  const showActivityFeed = authStatus?.isGitHubConnected;

  return (
    <div className='flex flex-1 flex-col'>
      <div className='@container/main flex flex-1 flex-col gap-2'>
        <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
          <GitHubErrorBoundary>
            <SectionCards />
          </GitHubErrorBoundary>

          <div className='grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:gap-6 lg:px-6'>
            <div className='lg:col-span-2'>
              {showGitHubPrompt ? (
                <GitHubConnectionPrompt
                  onConnectionUpdate={connected => {
                    if (connected) {
                      refetchAuth();
                    }
                  }}
                />
              ) : showActivityFeed ? (
                <ActivityFeedErrorBoundary>
                  <ActivityFeed selectedRepository={selectedRepository} />
                </ActivityFeedErrorBoundary>
              ) : (
                <div className='p-6 text-center text-muted-foreground'>
                  <p>Loading activity feed...</p>
                </div>
              )}
            </div>
            <div className='lg:col-span-1'>
              <GitHubErrorBoundary>
                <AISummary />
              </GitHubErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
