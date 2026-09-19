import {budgets, paymentMethods, transactions} from '@budgetbuddyde/db/backend';
import {and, eq, gte, inArray, lte} from 'drizzle-orm';
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {fromZonedTime, toZonedTime} from 'date-fns-tz';
import type {IGetInsightsReportQuery} from '@budgetbuddyde/api/interfaces';
import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import {config} from '../../config';
import {db} from '../../db';

type Granularity = 'day' | 'week' | 'month';
type Period = {from: Date; to: Date};
type Bucket = Period & {label: string};
type ReportTransaction = Awaited<ReturnType<typeof loadTransactions>>[number];
type CategoryView = TInsightsReport['categories'][number]['category'];
type PaymentMethodView = TInsightsReport['paymentMethods'][number]['paymentMethod'];

const round = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

function metric(current: number, previous: number | null): TInsightsReport['summary']['income'] {
  const absoluteChange = previous === null ? null : round(current - previous);
  const percentChange =
    previous === null || previous === 0
      ? current === 0
        ? 0
        : null
      : round((absoluteChange! / Math.abs(previous)) * 100);
  return {
    value: round(current),
    previousValue: previous === null ? null : round(previous),
    absoluteChange,
    percentChange,
  };
}

function dateOnly(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  return new Date(zoned.getFullYear(), zoned.getMonth(), zoned.getDate());
}

function toInstant(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone);
}

export function periodFromQuery(query: IGetInsightsReportQuery): Period {
  const fromLocal = startOfDay(dateOnly(query.$dateFrom!, config.timezone));
  const toLocal = endOfDay(dateOnly(query.$dateTo!, config.timezone));
  return {from: toInstant(fromLocal, config.timezone), to: toInstant(toLocal, config.timezone)};
}

function previousPeriod(period: Period): Period {
  const days = differenceInCalendarDays(period.to, period.from) + 1;
  const to = addDays(period.from, -1);
  return {from: addDays(to, -(days - 1)), to};
}

function resolveGranularity(query: IGetInsightsReportQuery, period: Period): Granularity {
  if (query.$granularity && query.$granularity !== 'auto') return query.$granularity;
  const days = differenceInCalendarDays(period.to, period.from) + 1;
  return days <= 31 ? 'day' : days <= 180 ? 'week' : 'month';
}

function makeBuckets(period: Period, granularity: Granularity): Bucket[] {
  const from = dateOnly(period.from, config.timezone);
  const to = dateOnly(period.to, config.timezone);
  const first =
    granularity === 'day'
      ? startOfDay(from)
      : granularity === 'week'
        ? startOfWeek(from, {weekStartsOn: 1})
        : startOfMonth(from);
  const result: Bucket[] = [];
  let cursor = first;
  while (cursor <= to) {
    const rawTo =
      granularity === 'day'
        ? endOfDay(cursor)
        : granularity === 'week'
          ? endOfWeek(cursor, {weekStartsOn: 1})
          : endOfMonth(cursor);
    const bucketFrom = cursor < from ? from : cursor;
    const bucketTo = rawTo > to ? to : rawTo;
    result.push({
      from: toInstant(startOfDay(bucketFrom), config.timezone),
      to: toInstant(endOfDay(bucketTo), config.timezone),
      label: labelFor(cursor, granularity),
    });
    cursor =
      granularity === 'day' ? addDays(cursor, 1) : granularity === 'week' ? addWeeks(cursor, 1) : addMonths(cursor, 1);
  }
  return result;
}

function labelFor(date: Date, granularity: Granularity): string {
  if (granularity === 'day') return date.toISOString().slice(0, 10);
  if (granularity === 'week') return 'W' + String(getIsoWeek(date)).padStart(2, '0') + ' ' + date.getFullYear();
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

function getIsoWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const day = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - day + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
  );
}

function amountStats(items: ReportTransaction[]) {
  const income = items.reduce(
    (sum, transaction) => sum + (transaction.transferAmount > 0 ? transaction.transferAmount : 0),
    0,
  );
  const expenses = items.reduce(
    (sum, transaction) => sum + (transaction.transferAmount < 0 ? Math.abs(transaction.transferAmount) : 0),
    0,
  );
  const expenseCount = items.filter(transaction => transaction.transferAmount < 0).length;
  return {
    income,
    expenses,
    balance: income - expenses,
    count: items.length,
    averageExpense: expenseCount ? expenses / expenseCount : 0,
  };
}

async function loadTransactions(ownerId: string, period: Period, query: IGetInsightsReportQuery) {
  const conditions = [
    eq(transactions.ownerId, ownerId),
    gte(transactions.processedAt, period.from),
    lte(transactions.processedAt, period.to),
  ];
  if (query.$categories?.length) conditions.push(inArray(transactions.categoryId, query.$categories));
  if (query.$paymentMethods?.length) conditions.push(inArray(transactions.paymentMethodId, query.$paymentMethods));
  return db.query.transactions.findMany({
    where: and(...conditions),
    orderBy: (fields, operators) => [operators.asc(fields.processedAt), operators.asc(fields.id)],
    with: {category: true, paymentMethod: true},
  });
}

export async function loadReportTransactions(ownerId: string, query: IGetInsightsReportQuery) {
  return loadTransactions(ownerId, periodFromQuery(query), query);
}

export async function loadReportTransactionPage(
  ownerId: string,
  query: IGetInsightsReportQuery,
  offset: number,
  limit: number,
) {
  const period = periodFromQuery(query);
  const conditions = [
    eq(transactions.ownerId, ownerId),
    gte(transactions.processedAt, period.from),
    lte(transactions.processedAt, period.to),
  ];
  if (query.$categories?.length) conditions.push(inArray(transactions.categoryId, query.$categories));
  if (query.$paymentMethods?.length) conditions.push(inArray(transactions.paymentMethodId, query.$paymentMethods));
  return db.query.transactions.findMany({
    where: and(...conditions),
    orderBy: (fields, operators) => [operators.asc(fields.processedAt), operators.asc(fields.id)],
    limit,
    offset,
    with: {category: true, paymentMethod: true},
  });
}

function bucketTransactions(items: ReportTransaction[], buckets: Bucket[]): ReportTransaction[][] {
  return buckets.map(bucket =>
    items.filter(transaction => isWithinInterval(transaction.processedAt, {start: bucket.from, end: bucket.to})),
  );
}

function categoryShape(category: ReportTransaction['category']): CategoryView {
  return {id: category.id as CategoryView['id'], name: category.name, description: category.description};
}

function paymentMethodShape(paymentMethod: ReportTransaction['paymentMethod']): PaymentMethodView {
  return {id: paymentMethod.id as PaymentMethodView['id'], name: paymentMethod.name, provider: paymentMethod.provider};
}

export async function buildInsightsReport(ownerId: string, query: IGetInsightsReportQuery): Promise<TInsightsReport> {
  const period = periodFromQuery(query);
  const comparison = query.$comparison === 'none' ? null : previousPeriod(period);
  const granularity = resolveGranularity(query, period);
  const [currentTransactions, previousTransactions, allPaymentMethods] = await Promise.all([
    loadTransactions(ownerId, period, query),
    comparison ? loadTransactions(ownerId, comparison, query) : Promise.resolve([]),
    db.query.paymentMethods.findMany({
      where: eq(paymentMethods.ownerId, ownerId),
      orderBy: (fields, operators) => [operators.asc(fields.name)],
    }),
  ]);
  const current = amountStats(currentTransactions);
  const previous = amountStats(previousTransactions);
  const currentBuckets = makeBuckets(period, granularity);
  const previousBuckets = comparison ? makeBuckets(comparison, granularity) : [];
  const currentByBucket = bucketTransactions(currentTransactions, currentBuckets);
  const previousByBucket = bucketTransactions(previousTransactions, previousBuckets);
  let cumulativeExpenses = 0;
  let cumulativeBalance = 0;
  const timeline = currentBuckets.map((bucket, index) => {
    const values = amountStats(currentByBucket[index]);
    cumulativeExpenses += values.expenses;
    cumulativeBalance += values.balance;
    const previousValues = previousByBucket[index] ? amountStats(previousByBucket[index]) : null;
    return {
      from: bucket.from,
      to: bucket.to,
      label: bucket.label,
      income: round(values.income),
      expenses: round(values.expenses),
      balance: round(values.balance),
      cumulativeExpenses: round(cumulativeExpenses),
      cumulativeBalance: round(cumulativeBalance),
      previousIncome: previousValues ? round(previousValues.income) : null,
      previousExpenses: previousValues ? round(previousValues.expenses) : null,
      previousBalance: previousValues ? round(previousValues.balance) : null,
    };
  });

  const categoriesById = new Map<
    string,
    {category: ReturnType<typeof categoryShape>; current: ReportTransaction[]; previous: ReportTransaction[]}
  >();
  for (const transaction of currentTransactions) {
    const entry = categoriesById.get(transaction.category.id) ?? {
      category: categoryShape(transaction.category),
      current: [],
      previous: [],
    };
    entry.current.push(transaction);
    categoriesById.set(transaction.category.id, entry);
  }
  for (const transaction of previousTransactions) {
    const entry = categoriesById.get(transaction.category.id) ?? {
      category: categoryShape(transaction.category),
      current: [],
      previous: [],
    };
    entry.previous.push(transaction);
    categoriesById.set(transaction.category.id, entry);
  }
  const categoryRows = [...categoriesById.values()].sort(
    (a, b) => amountStats(b.current).expenses - amountStats(a.current).expenses,
  );
  const categoriesResult = categoryRows.map(row => {
    const now = amountStats(row.current);
    const before = amountStats(row.previous);
    return {
      category: row.category,
      income: metric(now.income, comparison ? before.income : null),
      expenses: metric(now.expenses, comparison ? before.expenses : null),
      balance: metric(now.balance, comparison ? before.balance : null),
      transactionCount: metric(now.count, comparison ? before.count : null),
      averageExpense: metric(now.averageExpense, comparison ? before.averageExpense : null),
      expenseShare: current.expenses === 0 ? 0 : round((now.expenses / current.expenses) * 100),
    };
  });
  const categoryTimeline: TInsightsReport['categoryTimeline'] = categoryRows.slice(0, 5).map(row => {
    let cumulative = 0;
    return {
      categoryId: row.category.id as TInsightsReport['categoryTimeline'][number]['categoryId'],
      label: row.category.name,
      values: currentByBucket.map(items => {
        cumulative += amountStats(items.filter(transaction => transaction.category.id === row.category.id)).expenses;
        return round(cumulative);
      }),
    };
  });
  if (categoryRows.length > 5) {
    const topIds = new Set<string>(categoryRows.slice(0, 5).map(row => row.category.id));
    let cumulative = 0;
    categoryTimeline.push({
      categoryId: null,
      label: 'Other',
      values: currentByBucket.map(items => {
        cumulative += amountStats(items.filter(transaction => !topIds.has(transaction.category.id))).expenses;
        return round(cumulative);
      }),
    });
  }

  const paymentRows = allPaymentMethods.map(paymentMethod => {
    const nowItems = currentTransactions.filter(transaction => transaction.paymentMethod.id === paymentMethod.id);
    const beforeItems = previousTransactions.filter(transaction => transaction.paymentMethod.id === paymentMethod.id);
    const now = amountStats(nowItems);
    const before = amountStats(beforeItems);
    return {
      paymentMethod: paymentMethodShape(paymentMethod),
      transactionCount: metric(now.count, comparison ? before.count : null),
      income: metric(now.income, comparison ? before.income : null),
      expenses: metric(now.expenses, comparison ? before.expenses : null),
      balance: metric(now.balance, comparison ? before.balance : null),
      usageShare: current.count === 0 ? 0 : round((now.count / current.count) * 100),
      lastUsedAt: nowItems.at(-1)?.processedAt ?? null,
    };
  });
  if (query.$paymentMethods?.length) {
    const selected = new Set(query.$paymentMethods);
    paymentRows.splice(0, paymentRows.length, ...paymentRows.filter(row => selected.has(row.paymentMethod.id)));
  }

  const receivers = new Map<string, {current: ReportTransaction[]; previous: ReportTransaction[]}>();
  for (const transaction of currentTransactions) {
    const entry = receivers.get(transaction.receiver) ?? {current: [], previous: []};
    entry.current.push(transaction);
    receivers.set(transaction.receiver, entry);
  }
  for (const transaction of previousTransactions) {
    const entry = receivers.get(transaction.receiver) ?? {current: [], previous: []};
    entry.previous.push(transaction);
    receivers.set(transaction.receiver, entry);
  }
  const receiverRows = [...receivers.entries()]
    .sort(([, left], [, right]) => amountStats(right.current).expenses - amountStats(left.current).expenses)
    .slice(0, 10)
    .map(([receiver, values]) => {
      const now = amountStats(values.current);
      const before = amountStats(values.previous);
      return {
        receiver,
        expenses: metric(now.expenses, comparison ? before.expenses : null),
        transactionCount: metric(now.count, comparison ? before.count : null),
        averageExpense: metric(now.averageExpense, comparison ? before.averageExpense : null),
      };
    });

  return {
    period: {from: period.from, to: period.to},
    comparisonPeriod: comparison ? {from: comparison.from, to: comparison.to} : null,
    granularity,
    summary: {
      income: metric(current.income, comparison ? previous.income : null),
      expenses: metric(current.expenses, comparison ? previous.expenses : null),
      balance: metric(current.balance, comparison ? previous.balance : null),
      savingsRate: metric(
        current.income === 0 ? 0 : (current.balance / current.income) * 100,
        comparison ? (previous.income === 0 ? 0 : (previous.balance / previous.income) * 100) : null,
      ),
      transactionCount: metric(current.count, comparison ? previous.count : null),
      averageExpense: metric(current.averageExpense, comparison ? previous.averageExpense : null),
    },
    timeline,
    categoryTimeline,
    categories: categoriesResult,
    paymentMethods: paymentRows,
    receivers: receiverRows,
    budgets: await buildCurrentBudgets(ownerId, period),
  };
}

async function buildCurrentBudgets(ownerId: string, period: Period): Promise<TInsightsReport['budgets']> {
  const today = toZonedTime(new Date(), config.timezone);
  const monthFrom = toInstant(startOfDay(startOfMonth(today)), config.timezone);
  const monthTo = toInstant(endOfDay(endOfMonth(today)), config.timezone);
  if (period.to < monthFrom || period.from > monthTo) return null;
  const [budgetRows, monthTransactions] = await Promise.all([
    db.query.budgets.findMany({
      where: eq(budgets.ownerId, ownerId),
      with: {categories: {with: {category: true}}},
    }),
    db.query.transactions.findMany({
      where: and(
        eq(transactions.ownerId, ownerId),
        gte(transactions.processedAt, monthFrom),
        lte(transactions.processedAt, monthTo),
      ),
    }),
  ]);
  return budgetRows.map(budget => {
    const ids = new Set(budget.categories.map(category => category.categoryId));
    const spent = monthTransactions.reduce((sum, transaction) => {
      if (transaction.transferAmount >= 0) return sum;
      const applies = budget.type === 'i' ? ids.has(transaction.categoryId) : !ids.has(transaction.categoryId);
      return applies ? sum + Math.abs(transaction.transferAmount) : sum;
    }, 0);
    return {
      id: budget.id,
      name: budget.name,
      budget: budget.budget,
      spent: round(spent),
      remaining: round(budget.budget - spent),
      utilization: budget.budget === 0 ? 0 : round((spent / budget.budget) * 100),
      overBudget: spent > budget.budget,
    };
  });
}
