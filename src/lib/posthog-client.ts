'use client';

// Client-side PostHog utilities that don't import server-side modules
import { getPostHogStatus } from './posthog-adblocker-bypass';

export function captureClientError(error: Error, properties?: Record<string, any>): void {
  const status = getPostHogStatus();
  
  if (status.isAvailable && status.client) {
    try {
      status.client.captureException(error, {
        ...properties,
        error_boundary: 'client_error_utility',
        error_id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: window.navigator.userAgent,
      });
    } catch (posthogError) {
      console.error('Failed to capture error with PostHog:', posthogError);
    }
  } else {
    console.warn('PostHog client not available for error capture', {
      isAvailable: status.isAvailable,
      isBlocked: status.isBlocked,
      isFallback: status.isFallback,
    });
  }
}

export function captureClientEvent(event: string, properties?: Record<string, any>): void {
  const status = getPostHogStatus();
  
  if (status.isAvailable && status.client) {
    try {
      status.client.capture(event, {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    } catch (posthogError) {
      console.error('Failed to capture event with PostHog:', posthogError);
    }
  } else {
    console.warn('PostHog client not available for event capture', {
      isAvailable: status.isAvailable,
      isBlocked: status.isBlocked,
      isFallback: status.isFallback,
    });
  }
}

export function identifyUser(distinctId: string, properties?: Record<string, any>): void {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    try {
      (window as any).posthog.identify(distinctId, properties);
    } catch (posthogError) {
      console.error('Failed to identify user with PostHog:', posthogError);
    }
  } else {
    console.warn('PostHog client not available for user identification');
  }
}

export function resetPostHog(): void {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    try {
      (window as any).posthog.reset();
    } catch (posthogError) {
      console.error('Failed to reset PostHog:', posthogError);
    }
  } else {
    console.warn('PostHog client not available for reset');
  }
}

export function isPostHogAvailable(): boolean {
  const status = getPostHogStatus();
  return status.isAvailable;
}

export function getPostHogClient(): any {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    return (window as any).posthog;
  }
  return null;
}
