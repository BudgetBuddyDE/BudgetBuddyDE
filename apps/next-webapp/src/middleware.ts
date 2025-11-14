import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

const middlewareLogger = logger.child({ label: "middleware" });

export async function middleware(request: NextRequest) {
	const url = request.nextUrl;
	const meta: Record<string, string | number> = {
		method: request.method,
		path: url.pathname,
		origin: url.origin,
	};

	middlewareLogger.debug("Processing incoming request", meta);
	const cookies = getSessionCookie(request, {
		cookiePrefix: "budget-buddy",
	});
	if (!cookies) {
		middlewareLogger.warn(
			"No valid session cookie found, redirecting to sign-in",
			meta,
		);
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}

	middlewareLogger.debug(
		"Valid session cookie found, proceeding with request",
		meta,
	);
	return NextResponse.next();
}

// For more informations about the matcher configration take a look into the documentation:
// https://nextjs.org/docs/app/api-reference/file-conventions/middleware#matcher
export const config = {
	// matcher: ['/((?!auth).*)'], // REVISIT: For every page except sign-in, sign-up and public pages like 404 and 500
	matcher: [
		// {
		//   source: '/((?!.*(?:sign-in|sign-up|forgot-password|reset-password|_next|favicon.ico)).*)',
		// },
		"/dashboard/:path*",
		"/stocks/:path*",
		"/transactions",
		"/subscriptions",
		"/paymentMethods",
		"/categories",
		"/settings/:path*",
	], // REVISIT: For every page except sign-in, sign-up and public pages like 404 and 500
};
