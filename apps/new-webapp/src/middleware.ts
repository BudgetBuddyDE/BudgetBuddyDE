import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {authClient} from './authClient';

export async function middleware(request: NextRequest) {
  try {
    const {data, error} = await authClient.getSession({fetchOptions: {headers: request.headers}});
    if (!error && data) return NextResponse.next();
  } catch {
    // Authentication-service outages must fail closed without exposing a framework error page.
  }
  return NextResponse.redirect(new URL('/sign-in', request.url));
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/categories/:path*',
    '/payment-methods/:path*',
    '/recurring-payments/:path*',
    '/budgets/:path*',
    '/analytics/:path*',
    '/reports/:path*',
    '/attachments/:path*',
    '/import-export/:path*',
    '/settings/:path*',
  ],
};
