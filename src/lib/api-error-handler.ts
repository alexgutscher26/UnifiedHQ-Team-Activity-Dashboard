// Standardized error handling for API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Error types
export enum ApiErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
}

export interface ApiError {
  type: ApiErrorType;
  message: string;
  code: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// HTTP status codes mapping
const HTTP_STATUS_CODES: Record<ApiErrorType, number> = {
  [ApiErrorType.VALIDATION_ERROR]: 400,
  [ApiErrorType.AUTHENTICATION_ERROR]: 401,
  [ApiErrorType.AUTHORIZATION_ERROR]: 403,
  [ApiErrorType.NOT_FOUND]: 404,
  [ApiErrorType.CONFLICT]: 409,
  [ApiErrorType.RATE_LIMIT_ERROR]: 429,
  [ApiErrorType.EXTERNAL_SERVICE_ERROR]: 502,
  [ApiErrorType.INTERNAL_SERVER_ERROR]: 500,
  [ApiErrorType.BAD_REQUEST]: 400,
  [ApiErrorType.UNPROCESSABLE_ENTITY]: 422,
};

// Error codes mapping
const ERROR_CODES: Record<ApiErrorType, string> = {
  [ApiErrorType.VALIDATION_ERROR]: 'VALIDATION_FAILED',
  [ApiErrorType.AUTHENTICATION_ERROR]: 'UNAUTHORIZED',
  [ApiErrorType.AUTHORIZATION_ERROR]: 'FORBIDDEN',
  [ApiErrorType.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
  [ApiErrorType.CONFLICT]: 'RESOURCE_CONFLICT',
  [ApiErrorType.RATE_LIMIT_ERROR]: 'RATE_LIMIT_EXCEEDED',
  [ApiErrorType.EXTERNAL_SERVICE_ERROR]: 'EXTERNAL_SERVICE_UNAVAILABLE',
  [ApiErrorType.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [ApiErrorType.BAD_REQUEST]: 'BAD_REQUEST',
  [ApiErrorType.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
};

// Generate request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create standardized error
export function createApiError(
  type: ApiErrorType,
  message: string,
  details?: any,
  requestId?: string
): ApiError {
  return {
    type,
    message,
    code: ERROR_CODES[type],
    statusCode: HTTP_STATUS_CODES[type],
    details,
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId(),
  };
}

// Create success response
export function createApiSuccess<T>(
  data: T,
  message?: string,
  requestId?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId(),
  };
}

// Create error response
export function createApiErrorResponse(
  error: ApiError
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: error.statusCode }
  );
}

// Create success response
export function createApiSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(createApiSuccess(data, message, requestId), {
    status: 200,
  });
}

// Handle different error types
export function handleApiError(
  error: unknown,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  console.error('[API Error]', { error, requestId });

  // Zod validation errors
  if (error instanceof ZodError) {
    const validationError = createApiError(
      ApiErrorType.VALIDATION_ERROR,
      'Validation failed',
      {
        issues: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
      requestId
    );
    return createApiErrorResponse(validationError);
  }

  // Custom API errors
  if (error && typeof error === 'object' && 'type' in error) {
    const apiError = error as ApiError;
    return createApiErrorResponse(apiError);
  }

  // Generic errors
  if (error instanceof Error) {
    const internalError = createApiError(
      ApiErrorType.INTERNAL_SERVER_ERROR,
      process.env.NODE_ENV === 'production'
        ? 'An internal server error occurred'
        : error.message,
      process.env.NODE_ENV === 'development'
        ? { stack: error.stack }
        : undefined,
      requestId
    );
    return createApiErrorResponse(internalError);
  }

  // Unknown errors
  const unknownError = createApiError(
    ApiErrorType.INTERNAL_SERVER_ERROR,
    'An unknown error occurred',
    undefined,
    requestId
  );
  return createApiErrorResponse(unknownError);
}

// Wrapper for API route handlers
export function withErrorHandling<T = any>(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = generateRequestId();

    try {
      // Add request ID to headers for tracing
      const response = await handler(req, context);
      response.headers.set('X-Request-ID', requestId);
      return response;
    } catch (error) {
      return handleApiError(error, requestId);
    }
  };
}

// Common error creators
export const ApiErrors = {
  validation: (message: string, details?: any, requestId?: string) =>
    createApiError(ApiErrorType.VALIDATION_ERROR, message, details, requestId),

  authentication: (
    message: string = 'Authentication required',
    requestId?: string
  ) =>
    createApiError(
      ApiErrorType.AUTHENTICATION_ERROR,
      message,
      undefined,
      requestId
    ),

  authorization: (
    message: string = 'Insufficient permissions',
    requestId?: string
  ) =>
    createApiError(
      ApiErrorType.AUTHORIZATION_ERROR,
      message,
      undefined,
      requestId
    ),

  notFound: (resource: string = 'Resource', requestId?: string) =>
    createApiError(
      ApiErrorType.NOT_FOUND,
      `${resource} not found`,
      undefined,
      requestId
    ),

  conflict: (message: string, details?: any, requestId?: string) =>
    createApiError(ApiErrorType.CONFLICT, message, details, requestId),

  rateLimit: (message: string = 'Rate limit exceeded', requestId?: string) =>
    createApiError(
      ApiErrorType.RATE_LIMIT_ERROR,
      message,
      undefined,
      requestId
    ),

  externalService: (service: string, message?: string, requestId?: string) =>
    createApiError(
      ApiErrorType.EXTERNAL_SERVICE_ERROR,
      message || `${service} service unavailable`,
      { service },
      requestId
    ),

  internal: (
    message: string = 'Internal server error',
    details?: any,
    requestId?: string
  ) =>
    createApiError(
      ApiErrorType.INTERNAL_SERVER_ERROR,
      message,
      details,
      requestId
    ),

  badRequest: (message: string, details?: any, requestId?: string) =>
    createApiError(ApiErrorType.BAD_REQUEST, message, details, requestId),

  unprocessableEntity: (message: string, details?: any, requestId?: string) =>
    createApiError(
      ApiErrorType.UNPROCESSABLE_ENTITY,
      message,
      details,
      requestId
    ),
};

// Validation helpers
export function validateRequest<T>(
  schema: any,
  data: unknown,
  requestId?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw createApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Validation failed',
        {
          issues: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        },
        requestId
      );
    }
    throw error;
  }
}

// Rate limiting helper
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  // This is a simple in-memory rate limiter
  // In production, use Redis or a proper rate limiting service
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create rate limit data
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }

  const key = `rate_limit_${identifier}`;
  const requests = global.rateLimitStore.get(key) || [];

  // Filter requests within the window
  const recentRequests = requests.filter(
    (timestamp: number) => timestamp > windowStart
  );

  // Check if limit exceeded
  if (recentRequests.length >= limit) {
    return false;
  }

  // Add current request
  recentRequests.push(now);
  global.rateLimitStore.set(key, recentRequests);

  return true;
}

// Authentication helpers
export async function requireAuth(
  req: NextRequest
): Promise<{ userId: string; user: any }> {
  // ToDo: This should integrate with your auth system
  // For now, we'll check for a simple header
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiErrors.authentication();
  }

  const token = authHeader.substring(7);

  // ToDo: In a real implementation, verify the token
  // For now, we'll simulate a user
  if (token === 'invalid') {
    throw ApiErrors.authentication('Invalid token');
  }

  return {
    userId: 'user_123',
    user: { id: 'user_123', email: 'user@example.com' },
  };
}

// Logging helper
export function logApiError(
  error: ApiError,
  req: NextRequest,
  additionalContext?: any
) {
  const logData = {
    error: {
      type: error.type,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      requestId: error.requestId,
    },
    timestamp: error.timestamp,
    ...additionalContext,
  };

  if (error.statusCode >= 500) {
    console.error('[API Error - Server Error]', logData);
  } else if (error.statusCode >= 400) {
    console.warn('[API Error - Client Error]', logData);
  }
}

// Global rate limit store type
declare global {
  var rateLimitStore: Map<string, number[]> | undefined;
}
