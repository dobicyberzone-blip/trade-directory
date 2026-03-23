import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle redirects for old admin routes
  if (pathname === '/admin/logs' || pathname === '/super-admin/logs') {
    return NextResponse.redirect(new URL('/dashboard/admin/logs', request.url));
  }

  const response = NextResponse.next();

  // Add compression hint for Vercel/hosting platforms
  response.headers.set('Accept-Encoding', 'gzip, deflate, br');

  // Add performance hints
  if (pathname.startsWith('/_next/static')) {
    // Static assets - cache aggressively
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  } else if (pathname.startsWith('/api')) {
    // API routes - no cache
    response.headers.set(
      'Cache-Control',
      'no-store, must-revalidate'
    );
  } else {
    // Pages - cache with revalidation
    response.headers.set(
      'Cache-Control',
      'public, max-age=3600, stale-while-revalidate=86400'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
