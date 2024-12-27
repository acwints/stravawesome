import { NextResponse } from 'next/server';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class AuthError extends APIError {
  constructor(message: string = 'Not authenticated') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class StravaAPIError extends APIError {
  constructor(message: string) {
    super(message, 502, 'STRAVA_API_ERROR');
  }
}

export function handleAPIError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message, code: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'An unexpected error occurred', code: 'INTERNAL_SERVER_ERROR' },
    { status: 500 }
  );
} 