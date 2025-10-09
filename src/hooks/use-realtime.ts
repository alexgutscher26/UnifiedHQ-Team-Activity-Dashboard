'use client';

import { useEffect, useRef } from 'react';

interface UseRealTimeOptions {
  interval?: number;
  enabled?: boolean;
  onUpdate?: () => void;
}

export function useRealTime({
  interval = 30000,
  enabled = true,
  onUpdate,
}: UseRealTimeOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // Update the ref when onUpdate changes
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (onUpdateRef.current) {
        onUpdateRef.current();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval]);

  return {
    isActive: enabled && intervalRef.current !== null,
  };
}
