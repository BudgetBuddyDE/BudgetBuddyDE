import {and, eq, isNotNull, sql} from 'drizzle-orm';
import {backendSchema} from './schema';
import {categories, recurringPayments, transactions} from './tables';

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
      date: sql<Date>`(DATE_TRUNC('month', ${transactions.processedAt}) + INTERVAL '1 month - 1 day')::DATE`.as('date'),
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
      sql<Date>`(DATE_TRUNC('month', ${transactions.processedAt}) + INTERVAL '1 month - 1 day')::DATE`,
      transactions.ownerId,
      transactions.categoryId,
    ),
);

const historyCategoryJoin = and(
  eq(transactionHistoryView.categoryId, categories.id),
  eq(transactionHistoryView.ownerId, categories.ownerId),
);
const historyPeriod = {
  month: transactionHistoryView.month,
  year: transactionHistoryView.year,
  date: transactionHistoryView.date,
  ownerId: transactionHistoryView.ownerId,
};
const rootId = sql<string>`coalesce(${categories.parentId}, ${categories.id})`;

export const transactionRootHistoryView = backendSchema.view('transaction_root_history_view').as(qb =>
  qb
    .select({
      ...historyPeriod,
      categoryId: rootId.as('category_id'),
      income: sql<number>`sum(${transactionHistoryView.income})`.as('income'),
      expenses: sql<number>`sum(${transactionHistoryView.expenses})`.as('expenses'),
      balance: sql<number>`sum(${transactionHistoryView.balance})`.as('balance'),
    })
    .from(transactionHistoryView)
    .innerJoin(categories, historyCategoryJoin)
    .groupBy(...Object.values(historyPeriod), rootId),
);

export const transactionChildHistoryView = backendSchema.view('transaction_child_history_view').as(qb =>
  qb
    .select({
      ...historyPeriod,
      categoryId: categories.id,
      income: transactionHistoryView.income,
      expenses: transactionHistoryView.expenses,
      balance: transactionHistoryView.balance,
    })
    .from(transactionHistoryView)
    .innerJoin(categories, historyCategoryJoin)
    .where(isNotNull(categories.parentId)),
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
      date: sql<Date>`(DATE_TRUNC('month', ${transactions.processedAt}) + INTERVAL '1 month - 1 day')::DATE`.as('date'),
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
      sql<Date>`(DATE_TRUNC('month', ${transactions.processedAt}) + INTERVAL '1 month - 1 day')::DATE`,
      transactions.ownerId,
    ),
);
