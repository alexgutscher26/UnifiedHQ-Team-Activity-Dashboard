import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  withErrorHandling,
  createApiSuccessResponse,
  validateRequestBody,
  ApiErrors,
} from '@/lib/api-error-handler';
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
 * Logs an error report and associates it with the user session.
 *
 * This function retrieves the user session from the request headers, validates the error report data against a predefined schema, and logs the error details to the console. In a production environment, it is intended to integrate with an error tracking service and store the error data for further analysis. Finally, it returns a success response indicating that the error report was received.
 *
 * @param request - The NextRequest object containing the request data and headers.
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

  // In production, you would:
  // 1. Send to error tracking service (Sentry, LogRocket, etc.)
  // 2. Store in database for analysis
  // 3. Send alerts for critical errors

  console.error('Client Error Report:', {
    ...errorData,
    userId: session?.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  });

  // For now, just log the error
  // In production, integrate with your error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, LogRocket, or your error tracking service
    // await sendToErrorTrackingService(errorData);
  }

  return createApiSuccessResponse(
    { received: true },
    'Error report received successfully'
  );
}

export const POST = withErrorHandling(reportError);
