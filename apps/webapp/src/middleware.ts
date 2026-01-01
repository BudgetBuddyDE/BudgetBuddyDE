import {type NextRequest, NextResponse} from 'next/server';
import {authClient} from './authClient';
import {logger} from './logger';

const middlewareLogger = logger.child({scope: 'middleware'});

export async function middleware(request: NextRequest) {
  const SIGN_IN_ROUTE = '/sign-in';
  const url = request.nextUrl;
  const meta: Record<string, string | number> = {
    method: request.method,
    path: url.pathname,
    origin: url.origin,
  };

  middlewareLogger.debug('Processing incoming request...', meta);
  const {data, error} = await authClient.getSession({
    fetchOptions: {
      headers: request.headers,
    },
  });
  if (error) {
    middlewareLogger.error('Error retrieving the session: %o', error);
    return NextResponse.redirect(new URL(SIGN_IN_ROUTE, request.url));
  }

  if (!data) {
    middlewareLogger.info('No valid session found, redirecting to sign-in page', meta);
    return NextResponse.redirect(new URL(SIGN_IN_ROUTE, request.url));
  }

  middlewareLogger.debug('Session %s retrieved for user %s', data?.session.token, data?.user.id, meta);
  return NextResponse.next();
}

// For more informations about the matcher configration take a look into the documentation:
// https://nextjs.org/docs/app/api-reference/file-conventions/middleware#matcher
export const config = {
  runtime: 'nodejs',
  matcher: [
    '/dashboard/:path*',
    '/stocks/:path*',
    '/transactions',
    '/subscriptions',
    '/paymentMethods',
    '/categories',
    '/settings/:path*',
  ],
};
