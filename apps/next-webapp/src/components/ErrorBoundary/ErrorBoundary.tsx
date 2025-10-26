"use client";

import { Alert, AlertTitle, Button } from "@mui/material";
import { usePathname } from "next/navigation";
import React from "react";

export type ErrorBoundaryFallbackProps = {
	error: Error;
	reset: () => void;
};

export type ErrorBoundaryProps = {
	children: React.ReactNode;
	/**
	 * Simple ReactNode to render when an error occurs.
	 * If provided together with `FallbackComponent` or `fallbackRender`, the latter take precedence.
	 */
	fallback?: React.ReactNode;
	/**
	 * A component that's rendered when an error occurs. Receives { error, reset } as props.
	 */
	FallbackComponent?: React.ComponentType<ErrorBoundaryFallbackProps>;
	/**
	 * A render function used when an error occurs. Receives { error, reset }.
	 */
	fallbackRender?: (props: ErrorBoundaryFallbackProps) => React.ReactNode;
	/**
	 * Called when an error is caught.
	 */
	onError?: (error: Error, info: React.ErrorInfo) => void;
	/**
	 * Called after the boundary is reset via `reset()` or resetKeys change.
	 */
	onReset?: () => void;
	/**
	 * When any value in this array changes (shallow comparison), the boundary resets automatically.
	 * Useful to reset on route changes or param updates.
	 */
	resetKeys?: Array<unknown>;
};

export type ErrorBoundaryState = {
	hasError: boolean;
	error?: Error;
	prevResetKeys?: Array<unknown> | null;
};

/**
 * ErrorBoundary (Next.js 15 compatible)
 *
 * - Client Component ("use client"): wrap any subtree that may throw at runtime
 * - Supports `fallback`, `FallbackComponent`, or `fallbackRender`
 * - Supports `resetKeys` to auto-reset when inputs (e.g., route) change
 *
 * Example:
 *
 * <ErrorBoundary
 *   resetKeys={[pathname]}
 *   FallbackComponent={({ error, reset }) => (
 *     <div>
 *       <h2>Something wen't wrong</h2>
 *       <pre>{error.message}</pre>
 *       <button onClick={reset}>Retry</button>
 *     </div>
 *   )}
 * >
 *   <ProblematicComponent />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = {
		hasError: false,
		error: undefined,
		prevResetKeys: this.props.resetKeys ?? null,
	};

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo): void {
		this.props.onError?.(error, info);
	}

	componentDidUpdate(prevProps: ErrorBoundaryProps): void {
		if (this.haveResetKeysChanged(prevProps.resetKeys, this.props.resetKeys)) {
			this.resetInternal();
		}
	}

	private resetInternal() {
		this.setState({ hasError: false, error: undefined });
		this.props.onReset?.();
	}

	reset = () => {
		this.resetInternal();
	};

	render(): React.ReactNode {
		if (this.state.hasError) {
			const { FallbackComponent, fallbackRender, fallback } = this.props;
			const props: ErrorBoundaryFallbackProps = {
				error: this.state.error ?? new Error("Unbekannter Fehler"),
				reset: this.reset,
			};

			if (typeof fallbackRender === "function") {
				return fallbackRender(props);
			}

			if (FallbackComponent) {
				return <FallbackComponent {...props} />;
			}

			if (fallback) {
				return fallback;
			}

			return (
				<Alert
					variant="standard"
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={this.reset}>
							Retry
						</Button>
					}
				>
					<AlertTitle>Something wen't wrong</AlertTitle>
					{props.error.message}
				</Alert>
			);
		}

		return this.props.children;
	}

	private haveResetKeysChanged(
		prevKeys?: Array<unknown>,
		nextKeys?: Array<unknown>,
	) {
		const a = prevKeys ?? null;
		const b = nextKeys ?? null;
		if (a === b) return false;
		if (!a || !b) return true;
		if (a.length !== b.length) return true;
		for (let i = 0; i < a.length; i++) {
			if (Object.is(a[i], b[i]) === false) return true;
		}
		return false;
	}
}

/**
 * Convenience wrapper that resets the boundary automatically on route changes
 * (App Router). Useful for pages/segments that should recover when navigating.
 */
export function PathnameErrorBoundary(
	props: Omit<ErrorBoundaryProps, "resetKeys">,
) {
	const pathname = usePathname();
	return <ErrorBoundary {...props} resetKeys={[pathname]} />;
}
