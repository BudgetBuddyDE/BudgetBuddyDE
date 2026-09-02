import {type NextRequest, NextResponse} from 'next/server';
import {authClient} from './authClient';
import {logger} from './logger';

const proxyLogger = logger.child({module: 'proxy'});

export async function proxy(request: NextRequest) {
  const SIGN_IN_ROUTE = '/sign-in';
  const url = request.nextUrl;
  const meta: Record<string, string | number> = {
    method: request.method,
    path: url.pathname,
    origin: url.origin,
  };

  proxyLogger.debug('Processing incoming request...', meta);
  const {data, error} = await authClient.getSession({
    fetchOptions: {
      headers: request.headers,
    },
  });
  if (error) {
    proxyLogger.error('Error retrieving the session', error, meta);
    return NextResponse.redirect(new URL(SIGN_IN_ROUTE, request.url));
  }

  if (!data) {
    proxyLogger.info('No valid session found, redirecting to sign-in page', meta);
    return NextResponse.redirect(new URL(SIGN_IN_ROUTE, request.url));
  }

  proxyLogger.debug('Authenticated session retrieved', meta);
  return NextResponse.next();
}

// For more information about matcher configuration, see:
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
export const config = {
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
