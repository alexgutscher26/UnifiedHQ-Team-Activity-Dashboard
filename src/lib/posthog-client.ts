'use client';

// Client-side PostHog utilities that don't import server-side modules
import { getPostHogStatus } from './posthog-adblocker-bypass';

export function captureClientError(error: Error, properties?: Record<string, any>): void {
  const status = getPostHogStatus();
  
  if (status.isAvailable && status.client) {
    try {
      // Use PostHog's proper error capture method
      status.client.capture('$exception', {
        $exception_message: error.message,
        $exception_type: error.name,
        $exception_stack: error.stack,
        $exception_handled: false,
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

export function capturePageView(pageName?: string, properties?: Record<string, any>): void {
  const status = getPostHogStatus();
  
  if (status.isAvailable && status.client) {
    try {
      status.client.capture('$pageview', {
        $current_url: window.location.href,
        $host: window.location.host,
        $pathname: window.location.pathname,
        $page_title: document.title,
        ...(pageName && { page_name: pageName }),
        ...properties,
      });
    } catch (posthogError) {
      console.error('Failed to capture page view with PostHog:', posthogError);
    }
  } else {
    console.warn('PostHog client not available for page view capture');
  }
}

export function captureUserAction(action: string, properties?: Record<string, any>): void {
  const status = getPostHogStatus();
  
  if (status.isAvailable && status.client) {
    try {
      status.client.capture(action, {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    } catch (posthogError) {
      console.error('Failed to capture user action with PostHog:', posthogError);
    }
  } else {
    console.warn('PostHog client not available for user action capture');
  }
}

export function setUserProperties(properties: Record<string, any>): void {
  const status = getPostHogStatus();
  
  if (status.isAvailable && status.client) {
    try {
      status.client.people.set(properties);
    } catch (posthogError) {
      console.error('Failed to set user properties with PostHog:', posthogError);
    }
  } else {
    console.warn('PostHog client not available for setting user properties');
  }
}

export function getFeatureFlag(flagKey: string): boolean | string | undefined {
  const status = getPostHogStatus();
  
  if (status.isAvailable && status.client) {
    try {
      return status.client.getFeatureFlag(flagKey);
    } catch (posthogError) {
      console.error('Failed to get feature flag with PostHog:', posthogError);
      return undefined;
    }
  } else {
    console.warn('PostHog client not available for feature flag check');
    return undefined;
  }
}

export function isFeatureEnabled(flagKey: string): boolean {
  const status = getPostHogStatus();
  
  if (status.isAvailable && status.client) {
    try {
      return status.client.isFeatureEnabled(flagKey);
    } catch (posthogError) {
      console.error('Failed to check feature flag with PostHog:', posthogError);
      return false;
    }
  } else {
    console.warn('PostHog client not available for feature flag check');
    return false;
  }
}
