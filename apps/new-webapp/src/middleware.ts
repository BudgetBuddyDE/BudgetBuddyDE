import {type NextRequest, NextResponse} from 'next/server';
import {authClient} from '@/authClient';

export async function middleware(request: NextRequest) {
  try {
    const {data, error} = await authClient.getSession({fetchOptions: {headers: request.headers}});
    if (data && !error) return NextResponse.next();
  } catch {
    // Authentication service outages fail closed without exposing service details.
  }

  const signIn = new URL('/sign-in', request.url);
  signIn.searchParams.set('returnTo', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(signIn);
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
    '/reporting/:path*',
    '/attachments/:path*',
    '/settings/:path*',
  ],
};
