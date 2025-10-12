import { PostHog } from 'posthog-node';

let posthogInstance: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  // Check for both public and server environment variables
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || process.env.POSTHOG_HOST;
  
  if (!apiKey || !host) {
    console.warn(
      'PostHog server environment variables not found. Please check your .env file.',
      {
        hasPublicKey: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
        hasPublicHost: !!process.env.NEXT_PUBLIC_POSTHOG_HOST,
        hasServerKey: !!process.env.POSTHOG_KEY,
        hasServerHost: !!process.env.POSTHOG_HOST,
      }
    );
    return null;
  }

  if (!posthogInstance) {
    console.log('Initializing PostHog server client with:', { apiKey: apiKey.substring(0, 8) + '...', host });
    posthogInstance = new PostHog(apiKey, {
      host: host,
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
      console.log('Capturing server exception:', {
        errorMessage: error.message,
        errorName: error.name,
        distinctId: distinctId || 'anonymous',
        properties: additionalProperties,
      });
      
      // Use PostHog's proper error capture method
      await posthog.capture({
        distinctId: distinctId || 'anonymous',
        event: '$exception',
        properties: {
          $exception_message: error.message,
          $exception_type: error.name,
          $exception_stack: error.stack,
          $exception_handled: false,
          ...additionalProperties,
        },
      });
      
      // Flush to ensure data is sent immediately
      await posthog.flush();
      console.log('Server exception captured and flushed successfully');
    } else {
      console.warn('PostHog server client not available for exception capture');
    }
  } catch (err) {
    console.error('Failed to capture server exception:', err);
  }
}

/**
 * Captures client errors and sends them to the PostHog server.
 *
 * This function retrieves the PostHog server instance and, if available, sends a capture event with the error details, including the error message, name, stack, and any additional properties provided. If the PostHog server is not available or an error occurs during the capture process, it logs the failure to the console.
 *
 * @param {Error} error - The error object containing details about the client error.
 * @param {string} [distinctId] - An optional unique identifier for the user.
 * @param {Record<string, any>} [additionalProperties] - Optional additional properties to include with the error capture.
 */
export async function captureClientError(
  error: Error,
  distinctId?: string,
  additionalProperties?: Record<string, any>
): Promise<void> {
  try {
    const posthog = getPostHogServer();
    if (posthog) {
      console.log('Capturing client error:', {
        errorMessage: error.message,
        errorName: error.name,
        distinctId: distinctId || 'anonymous',
        properties: additionalProperties,
      });
      
      await posthog.capture({
        distinctId: distinctId || 'anonymous',
        event: '$exception',
        properties: {
          $exception_message: error.message,
          $exception_type: error.name,
          $exception_stack: error.stack,
          $exception_handled: false,
          error_source: 'client',
          ...additionalProperties,
        },
      });
      
      // Flush to ensure data is sent immediately
      await posthog.flush();
      console.log('Client error captured and flushed successfully');
    } else {
      console.warn('PostHog server client not available for client error capture');
    }
  } catch (err) {
    console.error('Failed to capture client error:', err);
  }
}
