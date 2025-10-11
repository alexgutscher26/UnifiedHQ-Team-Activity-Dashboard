import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  withErrorHandling,
  createApiSuccessResponse,
} from '@/lib/api-error-handler';
import { validateRequestBody } from '@/lib/api-validation';
import { captureClientError } from '@/lib/posthog-server';
import { z } from 'zod';

// Error report schema
const errorReportSchema = z.object({
  error: z.object({
    message: z.string(),
    stack: z.string().optional(),
    name: z.string().optional(),
  }),
  errorInfo: z
    .object({
      componentStack: z.string().optional(),
    })
    .optional(),
  errorId: z.string().optional(),
  url: z.string().url().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
});

/**
 * Report an error by capturing it and associating it with a user session.
 *
 * The function retrieves the user session from the request headers, validates the request body against a schema,
 * and constructs an error object. It then captures the error in PostHog with relevant context, logs the error details,
 * and returns a success response indicating that the error report was received.
 *
 * @param request - The NextRequest object containing the request data.
 * @returns A success response indicating that the error report was received.
 */
async function reportError(request: NextRequest) {
  // Get the session to associate errors with users
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const errorData = validateRequestBody(
    errorReportSchema,
    await request.json()
  );

  // Create error object for PostHog
  const error = new Error(errorData.error.message);
  error.name = errorData.error.name || 'ClientError';
  error.stack = errorData.error.stack;

  // Capture error in PostHog with additional context
  await captureClientError(error, session?.user?.id || 'anonymous', {
    errorId: errorData.errorId,
    url: errorData.url,
    userAgent: errorData.userAgent,
    componentStack: errorData.errorInfo?.componentStack,
    timestamp: errorData.timestamp || new Date().toISOString(),
    environment: process.env.NODE_ENV,
    errorType: 'client_error',
    userId: session?.user?.id || 'anonymous',
  });

  console.error('Client Error Report:', {
    ...errorData,
    userId: session?.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  });

  return createApiSuccessResponse(
    { received: true },
    'Error report received successfully'
  );
}

export const POST = withErrorHandling(reportError);
