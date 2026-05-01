import { sql } from "drizzle-orm";
import {
	date,
	doublePrecision,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { backendSchema } from "./schema";
import {
	budgetCategories,
	budgets,
	recurringPayments,
	transactions,
} from "./tables";

export const transactionReceiverView = backendSchema
	.view("transaction_receiver_view")
	.as((qb) =>
		qb
			.selectDistinct({
				receiver: sql<string>`TRIM(${transactions.receiver})`.as("receiver"),
				ownerId: transactions.ownerId,
			})
			.from(transactions)
			.union(
				qb
					.selectDistinct({
						receiver: sql<string>`TRIM(${recurringPayments.receiver})`.as(
							"receiver",
						),
						ownerId: recurringPayments.ownerId,
					})
					.from(recurringPayments),
			),
	);

/**
 * TransactionHistory
 * View welcher Einkommen, Ausgaben und Balance pro Monat und Jahr gruppiert nach Kategorie aggregiert.
 */
export const transactionHistoryView = backendSchema
	.view("transaction_history_view")
	.as((qb) =>
		qb
			.select({
				month: sql<number>`EXTRACT(MONTH FROM ${transactions.processedAt})`.as(
					"month",
				),
				year: sql<number>`EXTRACT(YEAR FROM ${transactions.processedAt})`.as(
					"year",
				),
				date: sql<Date>`(DATE_TRUNC('month', ${transactions.processedAt}) + INTERVAL '1 month - 1 day')::DATE`.as(
					"date",
				),
				ownerId: transactions.ownerId,
				categoryId: transactions.categoryId,
				income:
					sql<number>`SUM(CASE WHEN ${transactions.transferAmount} > 0 THEN ${transactions.transferAmount} ELSE 0 END)`.as(
						"income",
					),
				expenses:
					sql<number>`SUM(CASE WHEN ${transactions.transferAmount} < 0 THEN ABS(${transactions.transferAmount}) ELSE 0 END)`.as(
						"expenses",
					),
				balance: sql<number>`SUM(${transactions.transferAmount})`.as("balance"),
			})
			.from(transactions)
			.groupBy(
				sql`EXTRACT(MONTH FROM ${transactions.processedAt})`,
				sql`EXTRACT(YEAR FROM ${transactions.processedAt})`,
				sql<Date>`(DATE_TRUNC('month', ${transactions.processedAt}) + INTERVAL '1 month - 1 day')::DATE`,
				transactions.ownerId,
				transactions.categoryId,
			),
	);

/**
 * TransactionHistorySummary
 * View welcher Einkommen, Ausgaben und Balance pro Monat und Jahr aggregiert (ohne Kategorien).
 */
export const transactionHistorySummaryView = backendSchema
	.view("transaction_history_summary_view")
	.as((qb) =>
		qb
			.select({
				month: sql<number>`EXTRACT(MONTH FROM ${transactions.processedAt})`.as(
					"month",
				),
				year: sql<number>`EXTRACT(YEAR FROM ${transactions.processedAt})`.as(
					"year",
				),
				date: sql<Date>`(DATE_TRUNC('month', ${transactions.processedAt}) + INTERVAL '1 month - 1 day')::DATE`.as(
					"date",
				),
				ownerId: transactions.ownerId,
				income:
					sql<number>`SUM(CASE WHEN ${transactions.transferAmount} > 0 THEN ${transactions.transferAmount} ELSE 0 END)`.as(
						"income",
					),
				expenses:
					sql<number>`SUM(CASE WHEN ${transactions.transferAmount} < 0 THEN ABS(${transactions.transferAmount}) ELSE 0 END)`.as(
						"expenses",
					),
				balance: sql<number>`SUM(${transactions.transferAmount})`.as("balance"),
			})
			.from(transactions)
			.groupBy(
				sql`EXTRACT(MONTH FROM ${transactions.processedAt})`,
				sql`EXTRACT(YEAR FROM ${transactions.processedAt})`,
				sql<Date>`(DATE_TRUNC('month', ${transactions.processedAt}) + INTERVAL '1 month - 1 day')::DATE`,
				transactions.ownerId,
			),
	);

/**
 * SpendingGoals
 * View welcher das Ausgabenziel und die bisher getätigten Ausgaben pro Budget aggregiert.
 */
export const spendingGoalView = backendSchema
	.view("spending_goal_view")
	.as((qb) =>
		qb
			.select({
				month: sql<number>`EXTRACT(MONTH FROM ${transactions.processedAt})`.as(
					"month",
				),
				year: sql<number>`EXTRACT(YEAR FROM ${transactions.processedAt})`.as(
					"year",
				),
				date: sql<Date>`(DATE_TRUNC('month', ${transactions.processedAt}) + INTERVAL '1 month - 1 day')::DATE`.as(
					"date",
				),
				budgetId: budgetCategories.budgetId,
				ownerId: budgets.ownerId,
				spendingGoal: budgets.budget,
				spendingSoFar:
					sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transferAmount} < 0 THEN ABS(${transactions.transferAmount}) ELSE 0 END), 0)`.as(
						"spending_so_far",
					),
			})
			.from(budgets)
			.innerJoin(
				budgetCategories,
				sql`${budgetCategories.budgetId} = ${budgets.id}`,
			)
			.leftJoin(
				transactions,
				sql`${transactions.categoryId} = ${budgetCategories.categoryId} AND ${transactions.ownerId} = ${budgets.ownerId}`,
			)
			.groupBy(
				sql`EXTRACT(MONTH FROM ${transactions.processedAt})`,
				sql`EXTRACT(YEAR FROM ${transactions.processedAt})`,
				sql<Date>`(DATE_TRUNC('month', ${transactions.processedAt}) + INTERVAL '1 month - 1 day')::DATE`,
				budgetCategories.budgetId,
				budgets.ownerId,
				budgets.budget,
			),
	);

/**
 * RecurringPaymentExecution
 *
 * View that expands each non-paused recurring payment into individual execution
 * dates for the current calendar year using `generate_series`. The logic for
 * each plan type:
 *
 * - daily:      every day of the year
 * - weekly:     day where ISODOW = execute_at
 * - bi-weekly:  day where ISODOW = execute_at AND the ISO-week parity matches
 *               the week parity of created_at (so the payment keeps its
 *               every-other-week cadence from the creation date)
 * - monthly:    day where DAY = execute_at, with end-of-month clamping for
 *               months that have fewer days than execute_at
 * - quarterly:  same as monthly, but only in months whose distance from the
 *               anchor month (MONTH(created_at)) is a multiple of 3
 * - yearly:     same as monthly, but only in the month that matches
 *               MONTH(created_at)
 *
 * Created via migration 0003_execution_plan.sql; declared here as `.existing()`
 * so Drizzle has typed access without managing the view definition.
 */
export const recurringPaymentExecutionView = backendSchema
	.view("recurring_payment_execution_view", {
		id: uuid("id").notNull(),
		ownerId: varchar("owner_id").notNull(),
		categoryId: uuid("category_id").notNull(),
		paymentMethodId: uuid("payment_method_id").notNull(),
		receiver: varchar({ length: 100 }).notNull(),
		transferAmount: doublePrecision("transfer_amount").notNull(),
		information: text(),
		executeAt: text("execute_at").notNull(),
		executionPlan: text("execution_plan").notNull(),
		paused: text("paused").notNull(),
		createdAt: text("created_at").notNull(),
		executionDate: date("execution_date").notNull(),
	})
	.existing();
