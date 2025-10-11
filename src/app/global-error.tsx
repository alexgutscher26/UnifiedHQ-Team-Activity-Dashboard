'use client';

import posthog from 'posthog-js';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture the global error with PostHog (safe for mock client)
    try {
      if (typeof window !== 'undefined' && posthog && typeof posthog.captureException === 'function') {
        posthog.captureException(error, {
          error_boundary: 'global_error',
          digest: error.digest,
        });
      }
    } catch (posthogError) {
      console.error('Failed to capture error with PostHog:', posthogError);
    }
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
