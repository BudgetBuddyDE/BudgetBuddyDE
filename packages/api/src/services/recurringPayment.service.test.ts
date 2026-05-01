import { describe, expect, it } from "vitest";
import {
	calculateExecutionsForPeriod,
	getNextExecutionDate,
} from "./recurringPayment.service";

// Helper: build a minimal payment object for calculateExecutionsForPeriod
function makePayment(
	executeAt: number,
	plan: string,
	createdAt: Date = new Date("2024-01-15T00:00:00Z"),
) {
	return {
		executeAt,
		executionPlan: plan as Parameters<
			typeof calculateExecutionsForPeriod
		>[0]["executionPlan"],
		createdAt: createdAt.toISOString(),
	};
}

describe("calculateExecutionsForPeriod", () => {
	describe("daily", () => {
		it("returns every day in a 7-day window", () => {
			const from = new Date("2024-03-01");
			const to = new Date("2024-03-07");
			const result = calculateExecutionsForPeriod(
				makePayment(1, "daily"),
				from,
				to,
			);
			expect(result).toHaveLength(7);
		});
	});

	describe("weekly", () => {
		it("returns only Mondays (ISO weekday 1) in March 2024", () => {
			const from = new Date("2024-03-01");
			const to = new Date("2024-03-31");
			const result = calculateExecutionsForPeriod(
				makePayment(1, "weekly"),
				from,
				to,
			);
			// March 2024 Mondays: 4, 11, 18, 25
			expect(result).toHaveLength(4);
			expect(result.map((d) => d.getDate())).toEqual([4, 11, 18, 25]);
		});

		it("returns only Fridays (ISO weekday 5) in March 2024", () => {
			const from = new Date("2024-03-01");
			const to = new Date("2024-03-31");
			const result = calculateExecutionsForPeriod(
				makePayment(5, "weekly"),
				from,
				to,
			);
			// March 2024 Fridays: 1, 8, 15, 22, 29
			expect(result).toHaveLength(5);
			expect(result.map((d) => d.getDate())).toEqual([1, 8, 15, 22, 29]);
		});
	});

	describe("bi-weekly", () => {
		it("returns every other Monday matching the anchor week parity", () => {
			// 2024-01-15 is a Monday in ISO week 3 (odd)
			const anchor = new Date("2024-01-15");
			const from = new Date("2024-03-01");
			const to = new Date("2024-03-31");
			// Mondays in March 2024: 4(W10-even), 11(W11-odd), 18(W12-even), 25(W13-odd)
			// Anchor week 3 is odd → should match W11(11) and W13(25)
			const result = calculateExecutionsForPeriod(
				makePayment(1, "bi-weekly", anchor),
				from,
				to,
			);
			expect(result).toHaveLength(2);
			expect(result.map((d) => d.getDate())).toEqual([11, 25]);
		});
	});

	describe("monthly", () => {
		it("returns the 15th of each month in a quarter", () => {
			const from = new Date("2024-01-01");
			const to = new Date("2024-03-31");
			const result = calculateExecutionsForPeriod(
				makePayment(15, "monthly"),
				from,
				to,
			);
			expect(result).toHaveLength(3);
			// Use getDate()/getMonth() to stay in local time (avoids UTC-offset issues)
			expect(
				result.map(
					(d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
				),
			).toEqual(["2024-1-15", "2024-2-15", "2024-3-15"]);
		});

		it("clamps day 31 to last day of shorter months", () => {
			const from = new Date("2024-02-01");
			const to = new Date("2024-02-29");
			const result = calculateExecutionsForPeriod(
				makePayment(31, "monthly"),
				from,
				to,
			);
			// February 2024 has 29 days (leap year), day 31 clamps to 29
			expect(result).toHaveLength(1);
			expect(result[0].getDate()).toBe(29);
		});

		it("clamps day 31 to 28 in non-leap February", () => {
			const from = new Date("2023-02-01");
			const to = new Date("2023-02-28");
			const result = calculateExecutionsForPeriod(
				makePayment(31, "monthly"),
				from,
				to,
			);
			expect(result).toHaveLength(1);
			expect(result[0].getDate()).toBe(28);
		});
	});

	describe("quarterly", () => {
		it("returns the anchor month + every 3rd month after", () => {
			// Anchor: January 2024 (month 0) → quarterly months: Jan, Apr, Jul, Oct
			const anchor = new Date("2024-01-15");
			const from = new Date("2024-01-01");
			const to = new Date("2024-12-31");
			const result = calculateExecutionsForPeriod(
				makePayment(15, "quarterly", anchor),
				from,
				to,
			);
			expect(result).toHaveLength(4);
			expect(result.map((d) => d.getMonth())).toEqual([0, 3, 6, 9]);
		});

		it("handles anchor in April (month 3) → Apr, Jul, Oct, Jan", () => {
			const anchor = new Date("2024-04-10");
			const from = new Date("2024-01-01");
			const to = new Date("2024-12-31");
			const result = calculateExecutionsForPeriod(
				makePayment(10, "quarterly", anchor),
				from,
				to,
			);
			expect(result).toHaveLength(4);
			expect(result.map((d) => d.getMonth())).toEqual([0, 3, 6, 9]);
		});
	});

	describe("yearly", () => {
		it("returns only the anchor month across multiple years", () => {
			// Anchor: March 2022 → only fires in March
			const anchor = new Date("2022-03-20");
			const from = new Date("2024-01-01");
			const to = new Date("2024-12-31");
			const result = calculateExecutionsForPeriod(
				makePayment(20, "yearly", anchor),
				from,
				to,
			);
			expect(result).toHaveLength(1);
			// Use local-time accessors (service computes in local time)
			expect(result[0].getDate()).toBe(20);
			expect(result[0].getMonth()).toBe(2); // March = 2 (0-based)
		});

		it("returns nothing when anchor month is not in the window", () => {
			const anchor = new Date("2022-06-15");
			const from = new Date("2024-01-01");
			const to = new Date("2024-05-31");
			const result = calculateExecutionsForPeriod(
				makePayment(15, "yearly", anchor),
				from,
				to,
			);
			expect(result).toHaveLength(0);
		});
	});
});

describe("getNextExecutionDate", () => {
	it("returns today for daily plan", () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const result = getNextExecutionDate(1, "daily", new Date("2024-01-01"));
		result.setHours(0, 0, 0, 0);
		expect(result.getTime()).toBe(today.getTime());
	});

	it("returns a future or current date for monthly plan", () => {
		const anchor = new Date("2020-01-15");
		const result = getNextExecutionDate(15, "monthly", anchor);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		expect(result >= today).toBe(true);
	});
});
