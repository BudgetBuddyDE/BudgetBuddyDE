/**
 * Gerneric custom error class that extends the built-in Error class.
 * @author developer.mozilla.org
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types
 */
export class CustomError extends Error {
	// biome-ignore lint/suspicious/noExplicitAny: Params can be any
	constructor(...params: any[]) {
		// Pass remaining arguments (including vendor specific ones) to parent constructor
		super(...params);

		// Maintains proper stack trace for where our error was thrown (non-standard)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, CustomError);
		}

		this.name = this.constructor.name;
	}
}

/**
 * Error class representing an error occurring in the API layer.
 *
 * @example
 * ```ts
 * throw new ApiError("Failed to fetch data from API");
 * ```
 */
export class ApiError extends CustomError {}

/**
 * Error class representing a response that is not in JSON format.
 */
export class ResponseNotJsonError extends ApiError {
	constructor() {
		super("Response is not JSON");
	}
}

/**
 * Error class representing an HTTP response containing an error from the backend.
 */
export class BackendError extends CustomError {
	protected statusCode: number;
	protected backendResponseText: string;

	constructor(statusCode: number, backendResponseText: string) {
		super(backendResponseText);
		this.statusCode = statusCode;
		this.backendResponseText = backendResponseText;
	}

	getMessage(): string {
		return `Backend failed the request with status ${this.statusCode}: ${this.backendResponseText}`;
	}
}
