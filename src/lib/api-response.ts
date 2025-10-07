/**
 * Standardized API response utilities
 * Provides consistent response formatting and error handling
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Creates a successful API response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Creates an error API response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  logger.error(`API Error: ${error}`, undefined, { status, code, details });

  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  unauthorized: (message = 'Unauthorized') =>
    errorResponse(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden') =>
    errorResponse(message, 403, 'FORBIDDEN'),

  notFound: (message = 'Not found') =>
    errorResponse(message, 404, 'NOT_FOUND'),

  badRequest: (message = 'Bad request', details?: unknown) =>
    errorResponse(message, 400, 'BAD_REQUEST', details),

  internalError: (message = 'Internal server error', error?: Error) =>
    errorResponse(
      message,
      500,
      'INTERNAL_ERROR',
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    ),

  serviceUnavailable: (service: string) =>
    errorResponse(`${service} service is unavailable`, 503, 'SERVICE_UNAVAILABLE'),
};

/**
 * Wraps an async route handler with error handling
 */
export function withErrorHandling(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: () => Promise<NextResponse<any>>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<NextResponse<any>> {
  return handler().catch((error: Error) => {
    logger.error('Unhandled route error', error);
    return ErrorResponses.internalError('An unexpected error occurred', error);
  });
}

/**
 * Validates required environment variables
 */
export function validateEnvVars(vars: string[]): void {
  const missing = vars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
