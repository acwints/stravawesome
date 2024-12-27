import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// Debug logging function
function debugLog(message: string, data?: any) {
  console.log(`[Middleware] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  debugLog('Request:', { 
    pathname,
    method: request.method,
    headers: Object.fromEntries(request.headers),
  });

  // Skip auth check for public paths
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/strava-assets') ||
    pathname.startsWith('/images') ||
    pathname === '/' ||
    pathname === '/auth/signin' ||
    pathname === '/auth/error'
  ) {
    debugLog('Skipping auth check for public path');
    return NextResponse.next();
  }

  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    debugLog('Token status:', { hasToken: !!token });

    // Redirect to sign in if no token
    if (!token) {
      debugLog('No token found, redirecting to signin');
      const signInUrl = new URL('/auth/signin', request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Check if token is expired
    const expiration = token.exp as number | undefined;
    if (expiration && Date.now() / 1000 >= expiration) {
      debugLog('Token expired, redirecting to signin');
      const signInUrl = new URL('/auth/signin', request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Allow access to protected routes
    debugLog('Token valid, allowing access');
    return NextResponse.next();
  } catch (error) {
    debugLog('Error in middleware:', error);
    const signInUrl = new URL('/auth/signin', request.url);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}; 