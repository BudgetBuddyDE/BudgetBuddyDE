import { createAuthClient } from "better-auth/react";
import { redirect } from "next/navigation";
import { logger } from "./logger";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_AUTH_SERVICE_HOST || "http://localhost:8080",
	fetchOptions: {
		// onRequest(context) {
		// 	logger.debug("onRequest", context);
		// },
		// onResponse(context) {
		// 	logger.debug("onResponse", context);
		// },
		// onSuccess(context) {
		// 	logger.debug("onSuccess", context);
		// },
		onError(e) {
			if (e.error.status === 429) {
				logger.warn("Too many requests made to the auth service!");
			} else logger.error("An error occurred: %o", e.error);
		},
	},
});

export const signOut = (onSuccess?: () => void, onError?: () => void) =>
	authClient.signOut({
		fetchOptions: {
			onSuccess: () => {
				logger.info(
					"User signed out successfully! Redirecting to sign-in page...",
				);
				onSuccess?.();
				redirect("/sign-in");
			},
			onError: (ctx) => {
				logger.error("Error signing out:", ctx.error);
				onError?.();
			},
		},
	});

export const revalidateSession = (
	onSuccess?: () => void,
	onError?: () => void,
) =>
	authClient.getSession({
		fetchOptions: {
			onSuccess(context) {
				if (context.response.status === 401 || !context.data) {
					logger.info("Session is invalid, redirecting to sign-in page...");
					onError?.();
					redirect("/sign-in");
				}

				logger.info("Session revalidated successfully:", context.data);
				onSuccess?.();
			},
			onError() {
				logger.error("Error revalidating session");
				onError?.();
			},
		},
	});
