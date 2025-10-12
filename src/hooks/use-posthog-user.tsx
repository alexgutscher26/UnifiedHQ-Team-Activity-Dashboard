'use client';

import { useEffect, useState } from 'react';
import { identifyUser, setUserProperties, resetPostHog } from '@/lib/posthog-client';

export function usePostHogUser() {
  const [isIdentified, setIsIdentified] = useState(false);

  const identify = (distinctId: string, properties?: Record<string, any>) => {
    try {
      identifyUser(distinctId, {
        ...properties,
        identified_at: new Date().toISOString(),
        platform: 'web',
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      });
      setIsIdentified(true);
    } catch (error) {
      console.error('Failed to identify user with PostHog:', error);
    }
  };

  const setProperties = (properties: Record<string, any>) => {
    try {
      setUserProperties({
        ...properties,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to set user properties with PostHog:', error);
    }
  };

  const reset = () => {
    try {
      resetPostHog();
      setIsIdentified(false);
    } catch (error) {
      console.error('Failed to reset PostHog:', error);
    }
  };

  return {
    identify,
    setProperties,
    reset,
    isIdentified,
  };
}

// Component for automatic user identification
interface PostHogUserProviderProps {
  userId?: string;
  userProperties?: Record<string, any>;
  children: React.ReactNode;
}

export function PostHogUserProvider({ 
  userId, 
  userProperties, 
  children 
}: PostHogUserProviderProps) {
  const { identify, setProperties } = usePostHogUser();

  useEffect(() => {
    if (userId) {
      identify(userId, userProperties);
    }
  }, [userId, userProperties, identify]);

  useEffect(() => {
    if (userProperties && Object.keys(userProperties).length > 0) {
      setProperties(userProperties);
    }
  }, [userProperties, setProperties]);

  return <>{children}</>;
}

// Hook for tracking user actions with context
export function usePostHogUserTracking() {
  const { captureUserAction } = require('@/lib/posthog-client');

  const trackUserAction = (action: string, properties?: Record<string, any>) => {
    try {
      captureUserAction(action, {
        ...properties,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      });
    } catch (error) {
      console.error('Failed to track user action:', error);
    }
  };

  const trackUserJourney = (step: string, properties?: Record<string, any>) => {
    trackUserAction('user_journey_step', {
      step,
      ...properties,
    });
  };

  const trackUserEngagement = (engagementType: string, properties?: Record<string, any>) => {
    trackUserAction('user_engagement', {
      engagement_type: engagementType,
      ...properties,
    });
  };

  return {
    trackUserAction,
    trackUserJourney,
    trackUserEngagement,
  };
}
