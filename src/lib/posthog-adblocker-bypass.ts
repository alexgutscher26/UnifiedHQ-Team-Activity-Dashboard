'use client';

// PostHog Ad Blocker Bypass Utilities

interface PostHogConfig {
  api_host: string;
  ui_host: string;
  persistence: string;
  cross_subdomain_cookie: boolean;
  secure_cookie: boolean;
  disable_session_recording: boolean;
  capture_pageview: boolean;
  capture_pageleave: boolean;
  autocapture: boolean;
  capture_performance: boolean;
  capture_exceptions: boolean;
  capture_unhandled_rejections: boolean;
}

export function getAdBlockerBypassConfig(): Partial<PostHogConfig> {
  return {
    // Use localStorage instead of cookies to avoid ad blocker detection
    persistence: 'localStorage',
    cross_subdomain_cookie: false,
    secure_cookie: false,
    
    // Disable features that commonly trigger ad blockers
    disable_session_recording: true,
    autocapture: false, // Disable autocapture as it's often blocked
    
    // Keep essential features
    capture_pageview: true,
    capture_pageleave: true,
    capture_performance: false, // Disable performance tracking
    capture_exceptions: true,
    capture_unhandled_rejections: true,
  };
}

export function createFallbackPostHogClient() {
  const fallbackClient = {
    __loaded: true,
    __isFallback: true,
    capture: (event: string, properties?: any) => {
      console.log('PostHog fallback capture:', event, properties);
      // Try to send via fetch as fallback
      sendViaFetch(event, properties);
    },
    captureException: (error: Error, properties?: any) => {
      console.log('PostHog fallback exception:', error.message, properties);
      console.log('Attempting to send critical error to PostHog via fallback...');
      
      // Try to send via fetch as fallback
      sendViaFetch('exception', {
        error_message: error.message,
        error_stack: error.stack,
        error_name: error.name,
        error_type: 'critical_error',
        ...properties,
      }).then(() => {
        console.log('Critical error sent to PostHog via fallback');
      }).catch((err) => {
        console.error('Failed to send critical error to PostHog:', err);
      });
    },
    identify: (distinctId: string, properties?: any) => {
      console.log('PostHog fallback identify:', distinctId, properties);
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('posthog_user_id', distinctId);
        if (properties) {
          localStorage.setItem('posthog_user_properties', JSON.stringify(properties));
        }
      }
    },
    reset: () => {
      console.log('PostHog fallback reset');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('posthog_user_id');
        localStorage.removeItem('posthog_user_properties');
      }
    },
    isFeatureEnabled: (flag: string) => false,
    getFeatureFlag: (flag: string) => null,
    onFeatureFlags: (callback: Function) => {},
    reloadFeatureFlags: () => {},
  };
  
  // Set it on window immediately for detection
  if (typeof window !== 'undefined') {
    (window as any).posthog = fallbackClient;
  }
  
  return fallbackClient;
}

async function sendViaFetch(event: string, properties?: any) {
  if (typeof window === 'undefined') return;
  
  try {
    // First, try to send via our own API endpoint (server-side forwarding)
    try {
      const response = await fetch('/api/posthog/forward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            user_agent: navigator.userAgent,
            distinct_id: localStorage.getItem('posthog_user_id') || 'anonymous',
            fallback_client: true,
          },
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('PostHog fallback success via server forwarding:', result);
        return;
      } else {
        const errorText = await response.text();
        console.error('PostHog server forwarding failed with status:', response.status, errorText);
      }
    } catch (error) {
      console.log('PostHog server forwarding failed:', error);
    }
    
    // If server forwarding fails, try direct PostHog endpoints with obfuscation
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    
    if (!apiKey || !apiHost) return;
    
    // Create a minimal payload that might bypass ad blockers
    const payload = {
      api_key: apiKey,
      event: event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        distinct_id: localStorage.getItem('posthog_user_id') || 'anonymous',
      },
    };
    
    // Try different endpoints and methods that might not be blocked
    const attempts = [
      // Try with different HTTP methods
      { endpoint: `${apiHost}/e/`, method: 'POST' },
      { endpoint: `${apiHost}/e/`, method: 'GET' },
      // Try with obfuscated URLs
      { endpoint: `${apiHost}/capture/`, method: 'POST' },
      { endpoint: `${apiHost}/track/`, method: 'POST' },
      // Try with different content types
      { endpoint: `${apiHost}/e/`, method: 'POST', contentType: 'text/plain' },
    ];
    
    for (const attempt of attempts) {
      try {
        const headers: Record<string, string> = {};
        
        if (attempt.contentType) {
          headers['Content-Type'] = attempt.contentType;
        } else {
          headers['Content-Type'] = 'application/json';
        }
        
        const response = await fetch(attempt.endpoint, {
          method: attempt.method,
          headers,
          body: attempt.method === 'GET' ? undefined : JSON.stringify(payload),
        });
        
        if (response.ok) {
          console.log('PostHog fallback success via', attempt.endpoint, attempt.method);
          return;
        }
      } catch (error) {
        console.log('PostHog fallback failed via', attempt.endpoint, attempt.method, error);
        continue;
      }
    }
    
    console.warn('All PostHog fallback endpoints failed');
  } catch (error) {
    console.error('PostHog fallback error:', error);
  }
}

export function detectAdBlocker(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    
    // Test if PostHog endpoints are blocked
    const testUrl = process.env.NEXT_PUBLIC_POSTHOG_HOST + '/e/';
    
    fetch(testUrl, {
      method: 'HEAD',
      mode: 'no-cors',
    })
      .then(() => {
        resolve(false); // Not blocked
      })
      .catch(() => {
        resolve(true); // Likely blocked
      });
  });
}

export function getPostHogStatus(): {
  isAvailable: boolean;
  isBlocked: boolean;
  isFallback: boolean;
  client: any;
} {
  if (typeof window === 'undefined') {
    return {
      isAvailable: false,
      isBlocked: false,
      isFallback: false,
      client: null,
    };
  }
  
  const posthog = (window as any).posthog;
  
  if (!posthog) {
    return {
      isAvailable: false,
      isBlocked: true,
      isFallback: false,
      client: null,
    };
  }
  
  // Check if it's a fallback client
  const isFallback = posthog.__isFallback || false;
  
  return {
    isAvailable: true, // Fallback client is still available
    isBlocked: isFallback, // Blocked if using fallback
    isFallback: isFallback,
    client: posthog,
  };
}
