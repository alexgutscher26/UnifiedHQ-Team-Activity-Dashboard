'use client';

import { useEffect, useRef } from 'react';

interface UseRealTimeOptions {
  interval?: number;
  enabled?: boolean;
  onUpdate?: () => void;
}

/**
 * Manages a real-time update mechanism based on a specified interval.
 *
 * This function sets up an interval that calls the provided onUpdate function at the defined interval,
 * while also handling the enabling and disabling of the interval based on the enabled flag.
 * It ensures that the latest onUpdate function is used by updating the reference whenever it changes.
 * The interval is cleared when the component unmounts or when the enabled flag is set to false.
 *
 * @param {Object} options - Configuration options for the real-time updates.
 * @param {number} [options.interval=30000] - The interval in milliseconds for the updates.
 * @param {boolean} [options.enabled=true] - Flag to enable or disable the real-time updates.
 * @param {Function} [options.onUpdate] - The function to call at each interval.
 */
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
