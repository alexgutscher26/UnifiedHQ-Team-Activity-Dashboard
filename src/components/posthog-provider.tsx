'use client';

import { useEffect, useState } from 'react';
import { 
  getAdBlockerBypassConfig, 
  createFallbackPostHogClient, 
  detectAdBlocker,
  getPostHogStatus 
} from '@/lib/posthog-adblocker-bypass';

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
    console.log('PostHog Environment Check:', {
      hasKey: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
      hasHost: !!process.env.NEXT_PUBLIC_POSTHOG_HOST,
      keyValue: process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'Set' : 'Not Set',
      hostValue: process.env.NEXT_PUBLIC_POSTHOG_HOST ? 'Set' : 'Not Set',
    });

    if (
      !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
      !process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      console.warn(
        'PostHog environment variables not found. Please check your .env file.'
      );
      return;
    }

    // Dynamically import PostHog to avoid SSR issues
    const initializePostHog = async () => {
      try {
        // First, check if ad blocker is detected
        const isAdBlockerDetected = await detectAdBlocker();
        console.log('Ad blocker detected:', isAdBlockerDetected);

        if (isAdBlockerDetected) {
          console.warn('Ad blocker detected, using fallback PostHog client');
          const fallbackClient = createFallbackPostHogClient();
          
          // Set the fallback client on window.posthog so it can be detected
          (window as any).posthog = fallbackClient;
          
          setPosthogClient(fallbackClient);
          setIsInitialized(true);
          setHasError(true);
          return;
        }

        const posthog = await import('posthog-js');

        // Check if PostHog is already initialized
        if (posthog.default.__loaded) {
          console.log('PostHog already initialized');
          setPosthogClient(posthog.default);
          setIsInitialized(true);
          return;
        }

        // Get ad blocker bypass configuration
        const bypassConfig = getAdBlockerBypassConfig();

        // Initialize PostHog with ad blocker bypass configuration
        console.log('Initializing PostHog with bypass config:', {
          key: process.env.NEXT_PUBLIC_POSTHOG_KEY?.substring(0, 10) + '...',
          host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          bypassConfig,
        });

        posthog.default.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
          ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
          person_profiles: 'identified_only',
          ...bypassConfig,
          session_recording: {
            maskAllInputs: true,
            maskInputOptions: {
              password: true,
            },
          },
          loaded: (posthog) => {
            console.log('PostHog loaded successfully');
            setPosthogClient(posthog);
            setIsInitialized(true);
          },
        });

        // Set the client immediately for fallback
        setPosthogClient(posthog.default);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize PostHog:', error);

        // If PostHog fails completely, use fallback client
        console.warn('PostHog initialization failed, using fallback client');
        const fallbackClient = createFallbackPostHogClient();
        
        // Set the fallback client on window.posthog so it can be detected
        (window as any).posthog = fallbackClient;
        
        setPosthogClient(fallbackClient);
        setIsInitialized(true);
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

  // Only wrap with PostHog provider if PostHog is initialized
  if (typeof window !== 'undefined' && isInitialized && posthogClient) {
    try {
      // Check if we're using the mock client
      if (hasError && posthogClient.__loaded) {
        // For mock client, just render children without PostHog provider
        console.log('Using PostHog mock client');
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
