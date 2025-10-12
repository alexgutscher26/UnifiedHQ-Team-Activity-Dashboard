'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { capturePageView, captureUserAction } from '@/lib/posthog-client';

export function PostHogAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture page view when route changes
    if (pathname) {
      capturePageView(pathname, {
        $current_url: window.location.href,
        $host: window.location.host,
        $pathname: pathname,
        $search: searchParams.toString(),
        $page_title: document.title,
        timestamp: new Date().toISOString(),
      });
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}

// Hook for tracking user interactions
export function usePostHogAnalytics() {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    captureUserAction(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  };

  const trackPageView = (pageName?: string, properties?: Record<string, any>) => {
    capturePageView(pageName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  };

  const trackError = (error: Error, context?: string) => {
    captureUserAction('error_occurred', {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      context: context || 'unknown',
      timestamp: new Date().toISOString(),
    });
  };

  const trackUserAction = (action: string, properties?: Record<string, any>) => {
    trackEvent(action, properties);
  };

  return {
    trackEvent,
    trackPageView,
    trackError,
    trackUserAction,
  };
}
