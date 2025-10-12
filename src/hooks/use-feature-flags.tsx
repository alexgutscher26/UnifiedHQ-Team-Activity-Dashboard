'use client';

import { useState, useEffect } from 'react';
import { getFeatureFlag, isFeatureEnabled } from '@/lib/posthog-client';

export function useFeatureFlag(flagKey: string) {
  const [flagValue, setFlagValue] = useState<boolean | string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFlag = () => {
      try {
        const value = getFeatureFlag(flagKey);
        setFlagValue(value);
        setIsLoading(false);
      } catch (error) {
        console.error(`Failed to get feature flag ${flagKey}:`, error);
        setFlagValue(undefined);
        setIsLoading(false);
      }
    };

    checkFlag();
  }, [flagKey]);

  return {
    value: flagValue,
    isLoading,
    isEnabled: typeof flagValue === 'boolean' ? flagValue : false,
  };
}

export function useFeatureFlags(flagKeys: string[]) {
  const [flags, setFlags] = useState<Record<string, boolean | string | undefined>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFlags = () => {
      try {
        const flagValues: Record<string, boolean | string | undefined> = {};
        
        flagKeys.forEach(flagKey => {
          flagValues[flagKey] = getFeatureFlag(flagKey);
        });
        
        setFlags(flagValues);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to get feature flags:', error);
        setIsLoading(false);
      }
    };

    checkFlags();
  }, [flagKeys]);

  return {
    flags,
    isLoading,
    isEnabled: (flagKey: string) => {
      const value = flags[flagKey];
      return typeof value === 'boolean' ? value : false;
    },
  };
}

// Component for conditional rendering based on feature flags
interface FeatureFlagProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export function FeatureFlag({ flag, children, fallback = null, loading = null }: FeatureFlagProps) {
  const { value, isLoading } = useFeatureFlag(flag);

  if (isLoading) {
    return <>{loading}</>;
  }

  if (value === true || (typeof value === 'string' && value !== '')) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Hook for tracking feature flag usage
export function useFeatureFlagTracking() {
  const trackFlagUsage = (flagKey: string, flagValue: boolean | string | undefined) => {
    try {
      // Track feature flag usage as an event
      const { captureUserAction } = require('@/lib/posthog-client');
      captureUserAction('feature_flag_used', {
        flag_key: flagKey,
        flag_value: flagValue,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track feature flag usage:', error);
    }
  };

  return { trackFlagUsage };
}
