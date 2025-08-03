import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { logger } from './logger';

const middlewareLogger = logger.child({ scope: 'middleware' });

export async function middleware(request: NextRequest) {
  let meta: Record<string, string | number> = {
    method: request.method,
    url: request.url,
  };
  try {
    const cookies = getSessionCookie(request);
    if (!cookies) {
      middlewareLogger.warn('Redirecting to sign-in due to missing session cookie', meta);
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    middlewareLogger.debug('Session cookie found, proceeding with request', {
      cookies: cookies,
      ...meta,
    });
    return NextResponse.next();
  } catch (error) {
    middlewareLogger.error('Error retrieving session cookie:', { error, ...meta });
  }
}

// For more informations about the matcher configration take a look into the documentation:
// https://nextjs.org/docs/app/api-reference/file-conventions/middleware#matcher
export const config = {
  // matcher: ['/((?!auth).*)'], // REVISIT: For every page except sign-in, sign-up and public pages like 404 and 500
  matcher: [
    // {
    //   source: '/((?!.*(?:sign-in|sign-up|forgot-password|reset-password|_next|favicon.ico)).*)',
    // },
    '/dashboard',
    '/dashboard/:path*',
    '/stocks',
    '/stocks/:path*',
    '/transactions',
    '/subscriptions',
    '/paymentMethods',
    '/categories',
    '/settings',
    '/settings/:path*',
  ], // REVISIT: For every page except sign-in, sign-up and public pages like 404 and 500
};
