import {type NextRequest, NextResponse} from 'next/server';
import {authClient} from './authClient';
import {logger} from './logger';

const proxyLogger = logger.child({module: 'proxy'});

export async function proxy(request: NextRequest) {
  const SIGN_IN_ROUTE = '/sign-in';
  const url = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-budgetbuddy-authenticated-route');
  requestHeaders.delete('x-budgetbuddy-auth-route');
  const isAuthRoute =
    /^\/(?:sign-in|sign-up)$/.test(url.pathname) ||
    /^\/(?:password\/(?:request-reset|reset)|email\/(?:changed|verified)|user\/confirm-deletion)$/.test(url.pathname);
  if (isAuthRoute) requestHeaders.set('x-budgetbuddy-auth-route', '1');
  const isDashboardRoute =
    /^\/(?:dashboard|settings)(?:\/|$)/.test(url.pathname) ||
    /^\/(?:attachments|categories|paymentMethods|transactions|recurringPayments)(?:\/|$)/.test(url.pathname);
  if (isDashboardRoute) requestHeaders.set('x-budgetbuddy-authenticated-route', '1');
  const next = () => NextResponse.next({request: {headers: requestHeaders}});
  // Keep the existing authentication scope separate from locale routing.
  const requiresAuthentication =
    /^\/(?:dashboard|stocks|settings)(?:\/|$)/.test(url.pathname) ||
    ['/transactions', '/subscriptions', '/paymentMethods', '/categories'].includes(url.pathname);
  if (!requiresAuthentication) return next();
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
  return next();
}

// For more information about matcher configuration, see:
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
export const config = {
  matcher: [
    // Run for public pages too, so incoming clients cannot spoof the locale marker.
    '/:path*',
    '/dashboard/:path*',
    '/stocks/:path*',
    '/transactions',
    '/subscriptions',
    '/paymentMethods',
    '/categories',
    '/settings/:path*',
  ],
};
