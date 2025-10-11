'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        ui_host: 'https://us.posthog.com',
        defaults: '2025-05-24',
        capture_exceptions: true,
        debug: process.env.NODE_ENV === 'development',
      });
    } else if (typeof window !== 'undefined') {
      console.warn('PostHog environment variables not found. Please check your .env.local file.');
    }
  }, []);

  // Only wrap with PostHog provider if PostHog is initialized
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return (
      <PHProvider client={posthog}>
        {children}
      </PHProvider>
    );
  }

  // Fallback: render children without PostHog provider
  return <>{children}</>;
}
