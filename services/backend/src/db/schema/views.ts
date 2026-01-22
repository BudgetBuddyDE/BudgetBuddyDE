import {sql} from 'drizzle-orm';
import {backendSchema} from './schema';
import {budgetCategories, budgets, recurringPayments, transactions} from './tables';

export const transactionReceiverView = backendSchema.view('transaction_receiver_view').as(qb =>
  qb
    .selectDistinct({
      receiver: sql<string>`TRIM(${transactions.receiver})`.as('receiver'),
      ownerId: transactions.ownerId,
    })
    .from(transactions)
    .union(
      qb
        .selectDistinct({
          receiver: sql<string>`TRIM(${recurringPayments.receiver})`.as('receiver'),
          ownerId: recurringPayments.ownerId,
        })
        .from(recurringPayments),
    ),
);

/**
 * TransactionHistory
 * View welcher Einkommen, Ausgaben und Balance pro Monat und Jahr gruppiert nach Kategorie aggregiert.
 */
export const transactionHistoryView = backendSchema.view('transaction_history_view').as(qb =>
  qb
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${transactions.processedAt})`.as('month'),
      year: sql<number>`EXTRACT(YEAR FROM ${transactions.processedAt})`.as('year'),
      ownerId: transactions.ownerId,
      categoryId: transactions.categoryId,
      income:
        sql<number>`SUM(CASE WHEN ${transactions.transferAmount} > 0 THEN ${transactions.transferAmount} ELSE 0 END)`.as(
          'income',
        ),
      expenses:
        sql<number>`SUM(CASE WHEN ${transactions.transferAmount} < 0 THEN ABS(${transactions.transferAmount}) ELSE 0 END)`.as(
          'expenses',
        ),
      balance: sql<number>`SUM(${transactions.transferAmount})`.as('balance'),
    })
    .from(transactions)
    .groupBy(
      sql`EXTRACT(MONTH FROM ${transactions.processedAt})`,
      sql`EXTRACT(YEAR FROM ${transactions.processedAt})`,
      transactions.ownerId,
      transactions.categoryId,
    ),
);

/**
 * TransactionHistorySummary
 * View welcher Einkommen, Ausgaben und Balance pro Monat und Jahr aggregiert (ohne Kategorien).
 */
export const transactionHistorySummaryView = backendSchema.view('transaction_history_summary_view').as(qb =>
  qb
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${transactions.processedAt})`.as('month'),
      year: sql<number>`EXTRACT(YEAR FROM ${transactions.processedAt})`.as('year'),
      ownerId: transactions.ownerId,
      income:
        sql<number>`SUM(CASE WHEN ${transactions.transferAmount} > 0 THEN ${transactions.transferAmount} ELSE 0 END)`.as(
          'income',
        ),
      expenses:
        sql<number>`SUM(CASE WHEN ${transactions.transferAmount} < 0 THEN ABS(${transactions.transferAmount}) ELSE 0 END)`.as(
          'expenses',
        ),
      balance: sql<number>`SUM(${transactions.transferAmount})`.as('balance'),
    })
    .from(transactions)
    .groupBy(
      sql`EXTRACT(MONTH FROM ${transactions.processedAt})`,
      sql`EXTRACT(YEAR FROM ${transactions.processedAt})`,
      transactions.ownerId,
    ),
);

/**
 * SpendingGoals
 * View welcher das Ausgabenziel und die bisher getätigten Ausgaben pro Budget aggregiert.
 */
export const spendingGoalView = backendSchema.view('spending_goal_view').as(qb =>
  qb
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${transactions.processedAt})`.as('month'),
      year: sql<number>`EXTRACT(YEAR FROM ${transactions.processedAt})`.as('year'),
      budgetId: budgetCategories.budgetId,
      ownerId: budgets.ownerId,
      spendingGoal: budgets.budget,
      spendingSoFar:
        sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transferAmount} < 0 THEN ABS(${transactions.transferAmount}) ELSE 0 END), 0)`.as(
          'spending_so_far',
        ),
    })
    .from(budgets)
    .innerJoin(budgetCategories, sql`${budgetCategories.budgetId} = ${budgets.id}`)
    .leftJoin(
      transactions,
      sql`${transactions.categoryId} = ${budgetCategories.categoryId} AND ${transactions.ownerId} = ${budgets.ownerId}`,
    )
    .groupBy(
      sql`EXTRACT(MONTH FROM ${transactions.processedAt})`,
      sql`EXTRACT(YEAR FROM ${transactions.processedAt})`,
      budgetCategories.budgetId,
      budgets.ownerId,
      budgets.budget,
    ),
);
