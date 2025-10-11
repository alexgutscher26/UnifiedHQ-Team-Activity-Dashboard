'use client';

import posthog from 'posthog-js';
import NextError from 'next/error';
import { useEffect } from 'react';

/**
 * Component that captures and reports global errors.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture the global error with PostHog
    posthog.captureException(error, {
      error_boundary: 'global_error',
      digest: error.digest,
    });
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
