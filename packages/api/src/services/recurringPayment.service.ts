import { BackendError, ResponseNotJsonError } from "../error";
import type { IGetAllRecurringPaymentsQuery } from "../types/interfaces/recurringPayment.interface";
import type {
	TCreateOrUpdateRecurringPaymentPayload,
	TExecutionPlan,
	TExpandedRecurringPayment,
} from "../types/recurringPayment.type";
import {
	CreateRecurringPaymentResponse,
	DeleteRecurringPaymentResponse,
	GetAllRecurringPaymentsResponse,
	GetRecurringPaymentExecutionsResponse,
	GetRecurringPaymentResponse,
	UpdateRecurringPaymentResponse,
} from "../types/schemas/recurringPayment.schema";
import { EntityService } from "./entity.service";

export class RecurringPaymentService extends EntityService<
	TCreateOrUpdateRecurringPaymentPayload,
	Partial<TCreateOrUpdateRecurringPaymentPayload>,
	typeof GetAllRecurringPaymentsResponse,
	typeof GetRecurringPaymentResponse,
	typeof CreateRecurringPaymentResponse,
	typeof UpdateRecurringPaymentResponse,
	typeof DeleteRecurringPaymentResponse
> {
	constructor(host: string, entityPath = "/api/recurringPayment") {
		super(host, entityPath, {
			getAll: GetAllRecurringPaymentsResponse,
			get: GetRecurringPaymentResponse,
			create: CreateRecurringPaymentResponse,
			update: UpdateRecurringPaymentResponse,
			delete: DeleteRecurringPaymentResponse,
		});
	}

	async getAll(
		query?: IGetAllRecurringPaymentsQuery,
		requestConfig?: RequestInit,
	) {
		return super.getAll(query, requestConfig);
	}

	async getExecutions(
		id: TExpandedRecurringPayment["id"],
		from: Date,
		to: Date,
		requestConfig?: RequestInit,
	) {
		try {
			const params = new URLSearchParams({
				from: from.toISOString(),
				to: to.toISOString(),
			});
			const response = await fetch(
				`${this.getBaseRequestPath()}/${id}/executions?${params}`,
				this.mergeRequestConfig(
					{
						method: "GET",
						headers: new Headers(requestConfig?.headers || {}),
						credentials: "include",
					},
					requestConfig,
				),
			);
			if (!response.ok) {
				throw new BackendError(response.status, response.statusText);
			}
			if (!this.isJsonResponse(response)) {
				throw new ResponseNotJsonError();
			}
			const data = await response.json();
			const parsingResult =
				GetRecurringPaymentExecutionsResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null] as const;
		} catch (error) {
			return this.handleError(error);
		}
	}

	/**
	 * Calculates the next execution date for a recurring payment.
	 *
	 * @param executeAt - Interpretation depends on `executionPlan`:
	 *   - daily: ignored
	 *   - weekly/bi-weekly: ISO day of week (1 = Monday … 7 = Sunday)
	 *   - monthly/quarterly/yearly: day of month (1–31)
	 * @param executionPlan - The recurrence plan
	 * @param createdAt - Anchor date; determines week-parity (bi-weekly),
	 *   reference quarter (quarterly) and reference month (yearly)
	 */
	determineNextExecutionDate(
		executeAt: TExpandedRecurringPayment["executeAt"],
		executionPlan: TExecutionPlan = "monthly",
		createdAt: Date = new Date(),
	): Date {
		return getNextExecutionDate(executeAt, executionPlan, createdAt);
	}

	/**
	 * Returns all execution dates for a recurring payment within [from, to].
	 */
	calculateExecutionsForPeriod(
		payment: Pick<
			TExpandedRecurringPayment,
			"executeAt" | "executionPlan" | "createdAt"
		>,
		from: Date,
		to: Date,
	): Date[] {
		return calculateExecutionsForPeriod(payment, from, to);
	}
}

// ---------------------------------------------------------------------------
// Pure utility functions (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Returns the next execution date for a recurring payment from today.
 */
export function getNextExecutionDate(
	executeAt: number,
	executionPlan: TExecutionPlan,
	createdAt: Date,
): Date {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const candidates = generateExecutionDatesInWindow(
		executeAt,
		executionPlan,
		createdAt,
		today,
		new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
	);
	return candidates.find((d) => d >= today) ?? candidates[0] ?? today;
}

/**
 * Returns all execution dates for a recurring payment within [from, to].
 */
export function calculateExecutionsForPeriod(
	payment: Pick<
		TExpandedRecurringPayment,
		"executeAt" | "executionPlan" | "createdAt"
	>,
	from: Date,
	to: Date,
): Date[] {
	return generateExecutionDatesInWindow(
		payment.executeAt,
		payment.executionPlan,
		new Date(payment.createdAt),
		from,
		to,
	);
}

function generateExecutionDatesInWindow(
	executeAt: number,
	plan: TExecutionPlan,
	anchor: Date,
	from: Date,
	to: Date,
): Date[] {
	const results: Date[] = [];
	const cursor = new Date(from);
	cursor.setHours(0, 0, 0, 0);
	const end = new Date(to);
	end.setHours(23, 59, 59, 999);

	const anchorWeek = isoWeekNumber(anchor);
	const anchorMonth = anchor.getMonth(); // 0-based

	while (cursor <= end) {
		if (
			matchesExecutionPlan(cursor, executeAt, plan, anchorWeek, anchorMonth)
		) {
			results.push(new Date(cursor));
		}
		cursor.setDate(cursor.getDate() + 1);
	}
	return results;
}

function matchesExecutionPlan(
	date: Date,
	executeAt: number,
	plan: TExecutionPlan,
	anchorWeek: number,
	anchorMonth: number,
): boolean {
	switch (plan) {
		case "daily":
			return true;

		case "weekly":
			return isoWeekday(date) === executeAt;

		case "bi-weekly":
			return (
				isoWeekday(date) === executeAt &&
				isoWeekNumber(date) % 2 === anchorWeek % 2
			);

		case "monthly":
			return matchesDayOfMonth(date, executeAt);

		case "quarterly": {
			const monthDiff = (((date.getMonth() - anchorMonth) % 3) + 3) % 3;
			return monthDiff === 0 && matchesDayOfMonth(date, executeAt);
		}

		case "yearly":
			return (
				date.getMonth() === anchorMonth && matchesDayOfMonth(date, executeAt)
			);
	}
}

/** Returns true when `date`'s day of month equals `executeAt`, with end-of-month clamping. */
function matchesDayOfMonth(date: Date, executeAt: number): boolean {
	const lastDay = new Date(
		date.getFullYear(),
		date.getMonth() + 1,
		0,
	).getDate();
	const effectiveDay = Math.min(executeAt, lastDay);
	return date.getDate() === effectiveDay;
}

/** ISO weekday: Monday = 1, Sunday = 7 */
function isoWeekday(date: Date): number {
	const d = date.getDay();
	return d === 0 ? 7 : d;
}

/** ISO week number (1-based, Mon-Sun weeks) */
function isoWeekNumber(date: Date): number {
	const tmp = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	);
	const dayOfWeek = tmp.getUTCDay() || 7;
	tmp.setUTCDate(tmp.getUTCDate() + 4 - dayOfWeek);
	const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
	return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
