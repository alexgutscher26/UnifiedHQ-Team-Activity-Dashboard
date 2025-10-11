'use client';

import { useEffect, useState } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [posthogClient, setPosthogClient] = useState<any>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Only initialize PostHog in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Check if we have the required environment variables
    if (
      !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
      !process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      console.warn(
        'PostHog environment variables not found. Please check your .env.local file.'
      );
      return;
    }

    // Dynamically import PostHog to avoid SSR issues
    const initializePostHog = async () => {
      try {
        const posthog = await import('posthog-js');

        // Check if PostHog is already initialized
        if (posthog.default.__loaded) {
          console.log('PostHog already initialized');
          setPosthogClient(posthog.default);
          setIsInitialized(true);
          return;
        }

        // Create a mock PostHog client to prevent any network requests
        const mockPostHog = {
          __loaded: true,
          capture: (event: string, properties?: any) => {
            console.log('PostHog mock capture:', event, properties);
          },
          captureException: (error: Error, properties?: any) => {
            console.log('PostHog mock exception:', error.message, properties);
          },
          identify: (distinctId: string, properties?: any) => {
            console.log('PostHog mock identify:', distinctId, properties);
          },
          reset: () => {
            console.log('PostHog mock reset');
          },
          isFeatureEnabled: (flag: string) => false,
          getFeatureFlag: (flag: string) => null,
          onFeatureFlags: (callback: Function) => {},
          reloadFeatureFlags: () => {},
        };

        // Set the mock client instead of initializing PostHog
        console.log('PostHog loaded in mock mode (no network requests)');
        setPosthogClient(mockPostHog);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize PostHog:', error);

        // If PostHog fails completely, just continue without it
        console.warn(
          'PostHog initialization failed, continuing without analytics'
        );
        setHasError(true);
      }
    };

    // Wrap initialization in try-catch to prevent any unhandled errors
    try {
      initializePostHog();
    } catch (error) {
      console.error('PostHog initialization wrapper error:', error);
      setHasError(true);
    }
  }, []);

  // Only wrap with PostHog provider if PostHog is initialized and no errors
  if (
    typeof window !== 'undefined' &&
    isInitialized &&
    posthogClient &&
    !hasError
  ) {
    try {
      // Check if we're using the mock client
      if (
        posthogClient.__loaded &&
        typeof posthogClient.capture === 'function'
      ) {
        // For mock client, just render children without PostHog provider
        return <>{children}</>;
      }

      // For real PostHog client, use the provider
      const { PostHogProvider: PHProvider } = require('posthog-js/react');
      return <PHProvider client={posthogClient}>{children}</PHProvider>;
    } catch (error) {
      console.error('Failed to create PostHog provider:', error);
    }
  }

  // Fallback: render children without PostHog provider
  // This ensures the app works even if PostHog fails to load
  return <>{children}</>;
}
