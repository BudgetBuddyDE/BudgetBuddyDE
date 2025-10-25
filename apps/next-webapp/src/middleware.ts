import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { logger } from './logger';
import { authClient } from './authClient';

const middlewareLogger = logger.child({ label: 'middleware' });

export async function middleware(request: NextRequest) {
  let meta: Record<string, string | number> = {
    method: request.method,
    url: request.url,
  };
  try {
    middlewareLogger.debug('Checking if client has a valid session', meta);
    const { data: session, error } = await authClient.getSession({
      fetchOptions: {
        headers: await headers(),
      },
    });
    if (error) {
      middlewareLogger.error('Error retrieving session:', { error, ...meta });
    }

    if (!session || !session.session) {
      middlewareLogger.warn('No valid session found, redirecting to sign-in', meta);
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    middlewareLogger.debug('Session found, proceeding with request', {
      ...meta,
    });
    return NextResponse.next();
  } catch (error) {
    middlewareLogger.error(
      'Uncaught error while fetching session: %s',
      error instanceof Error ? error.message : String(error),
      { error, ...meta }
    );
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
    '/dashboard/:path*',
    '/stocks/:path*',
    '/transactions',
    '/subscriptions',
    '/paymentMethods',
    '/categories',
    '/settings/:path*',
  ], // REVISIT: For every page except sign-in, sign-up and public pages like 404 and 500
};
