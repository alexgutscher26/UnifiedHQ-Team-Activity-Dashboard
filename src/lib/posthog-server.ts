import { PostHog } from 'posthog-node';

let posthogInstance: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  // Only create instance if we have the required environment variables
  if (
    !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    !process.env.NEXT_PUBLIC_POSTHOG_HOST
  ) {
    console.warn(
      'PostHog server environment variables not found. Please check your .env.local file.'
    );
    return null;
  }

  if (!posthogInstance) {
    posthogInstance = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogInstance;
}

export async function captureServerException(
  error: Error,
  distinctId?: string,
  additionalProperties?: Record<string, any>
): Promise<void> {
  try {
    const posthog = getPostHogServer();
    if (posthog) {
      await posthog.captureException(error, distinctId || 'anonymous', {
        ...additionalProperties,
      });
    }
  } catch (err) {
    console.error('Failed to capture server exception:', err);
  }
}

export async function captureClientError(
  error: Error,
  distinctId?: string,
  additionalProperties?: Record<string, any>
): Promise<void> {
  try {
    const posthog = getPostHogServer();
    if (posthog) {
      await posthog.capture({
        distinctId: distinctId || 'anonymous',
        event: 'Client Error',
        properties: {
          error_message: error.message,
          error_name: error.name,
          error_stack: error.stack,
          ...additionalProperties,
        },
      });
    }
  } catch (err) {
    console.error('Failed to capture client error:', err);
  }
}
