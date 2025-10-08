import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for request/response logging and security headers
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Log incoming request in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${request.method} ${pathname}`);
  }

  const response = NextResponse.next();

  // Enhanced security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
    img-src 'self' blob: data: https: https://lh3.googleusercontent.com https://cdnjs.cloudflare.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://accounts.google.com https://www.strava.com https://api.openai.com https://*.supabase.co;
    frame-src 'self' https://accounts.google.com;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // Add CORS headers for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL || '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET,DELETE,PATCH,POST,PUT,OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
  }

  // Handle OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  // Log response time in development
  if (process.env.NODE_ENV === 'development') {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${request.method} ${pathname} - ${duration}ms`);
  }

  return response;
}

// Configure which routes use middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
