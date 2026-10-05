import * as tables from '@budgetbuddyde/db/backend';
import * as operators from 'drizzle-orm';
import {PgDialect} from 'drizzle-orm/pg-core';
import {
  buildInsightsReport,
  loadReportTransactionPage,
  loadReportTransactions,
  periodFromQuery,
} from '../lib/insights/report';

const {transactions, paymentMethods, budgets, config} = vi.hoisted(() => ({
  transactions: vi.fn(),
  paymentMethods: vi.fn(),
  budgets: vi.fn(),
  config: {timezone: 'UTC'},
}));
vi.mock('../config', () => ({config}));
vi.mock('../db', () => ({
  db: {
    query: {
      transactions: {findMany: transactions},
      paymentMethods: {findMany: paymentMethods},
      budgets: {findMany: budgets},
    },
  },
}));
const query = {
  $dateFrom: new Date('2026-01-01T12:00:00Z'),
  $dateTo: new Date('2026-01-03T12:00:00Z'),
  $granularity: 'day' as const,
};
const method = {id: 'method-1', name: 'Card', provider: 'Bank'};
function row(id: string, amount: number, categoryId = 'category-1', date = '2026-01-01T12:00:00Z', receiver = 'Shop') {
  return {
    id,
    ownerId: 'owner',
    transferAmount: amount,
    processedAt: new Date(date),
    categoryId,
    paymentMethodId: method.id,
    category: {id: categoryId, name: categoryId, description: null},
    paymentMethod: method,
    receiver,
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  config.timezone = 'UTC';
  transactions.mockResolvedValue([]);
  paymentMethods.mockResolvedValue([method, {id: 'unused', name: 'Cash', provider: 'Cash'}]);
  budgets.mockResolvedValue([]);
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-10T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('insights report data boundaries', () => {
  it('converts local calendar day limits across the DST transition', () => {
    config.timezone = 'Europe/Berlin';
    expect(
      periodFromQuery({
        ...query,
        $dateFrom: new Date('2026-03-29T12:00:00Z'),
        $dateTo: new Date('2026-03-29T12:00:00Z'),
      }),
    ).toEqual({from: new Date('2026-03-28T23:00:00Z'), to: new Date('2026-03-29T21:59:59.999Z')});
  });
  it('retains owner and selected category/payment filters for export and paging', async () => {
    const selected = {...query, $categories: ['category-1'], $paymentMethods: ['method-1']};
    await loadReportTransactions('owner', selected);
    await loadReportTransactionPage('owner', selected, 10, 50);
    for (const [options] of transactions.mock.calls) {
      const sql = new PgDialect().sqlToQuery(options.where);
      expect(sql.params).toContain('owner');
      expect(sql.params).toContain('category-1');
      expect(sql.params).toContain('method-1');
      expect(options.orderBy(tables.transactions, operators)).toHaveLength(2);
      expect(options.with).toEqual({category: true, paymentMethod: true});
    }
    expect(transactions.mock.calls[1][0]).toMatchObject({offset: 10, limit: 50});
  });
  it('propagates database errors rather than returning fabricated reports', async () => {
    transactions.mockRejectedValueOnce(new Error('database failure'));
    await expect(buildInsightsReport('owner', query)).rejects.toThrow('database failure');
  });
});

describe('insights calculations', () => {
  it('returns zero metrics and unused payment methods for empty data', async () => {
    const report = await buildInsightsReport('owner', query);
    expect(report.summary.income).toEqual({value: 0, previousValue: 0, absoluteChange: 0, percentChange: 0});
    expect(report.summary.averageExpense.value).toBe(0);
    expect(report.timeline).toHaveLength(3);
    expect(report.categories).toEqual([]);
    expect(report.receivers).toEqual([]);
    expect(report.budgets).toBeNull();
    expect(report.paymentMethods[0]).toMatchObject({usageShare: 0, lastUsedAt: null});
  });
  it('calculates positive income, absolute expenses, balance and comparisons', async () => {
    transactions.mockResolvedValueOnce([
      row('income', 100),
      row('expense', -30),
      row('expense2', -20, 'category-2', '2026-01-02T12:00:00Z', 'Market'),
    ]);
    transactions.mockResolvedValueOnce([
      row('previous', -25, 'previous-only', '2025-12-29T12:00:00Z', 'Old shop'),
      row('old-income', 50, 'previous-only', '2025-12-29T12:00:00Z'),
    ]);
    const report = await buildInsightsReport('owner', query);
    expect(report.summary.income).toEqual({value: 100, previousValue: 50, absoluteChange: 50, percentChange: 100});
    expect(report.summary.expenses.value).toBe(50);
    expect(report.summary.balance.value).toBe(50);
    expect(report.summary.savingsRate.value).toBe(50);
    expect(report.summary.transactionCount.value).toBe(3);
    expect(report.summary.averageExpense.value).toBe(25);
    expect(report.timeline.map(bucket => bucket.cumulativeExpenses)).toEqual([30, 50, 50]);
    expect(report.timeline.map(bucket => bucket.cumulativeBalance)).toEqual([70, 50, 50]);
    expect(report.categories.map(category => category.category.id)).toEqual([
      'category-1',
      'category-2',
      'previous-only',
    ]);
    expect(report.categories[0].expenseShare).toBe(60);
    expect(report.receivers[0].receiver).toBe('Shop');
    expect(report.paymentMethods[0]).toMatchObject({usageShare: 100, lastUsedAt: new Date('2026-01-02T12:00:00Z')});
  });
  it('disables comparison and excludes unselected payment methods', async () => {
    transactions.mockResolvedValueOnce([row('expense', -1)]);
    const report = await buildInsightsReport('owner', {...query, $comparison: 'none', $paymentMethods: ['method-1']});
    expect(transactions).toHaveBeenCalledOnce();
    expect(report.comparisonPeriod).toBeNull();
    expect(report.summary.expenses).toEqual({value: 1, previousValue: null, absoluteChange: null, percentChange: null});
    expect(report.timeline[0].previousExpenses).toBeNull();
    expect(report.paymentMethods).toHaveLength(1);
  });
  it('avoids infinite percent change when the previous amount is zero', async () => {
    transactions.mockResolvedValueOnce([row('expense', -10)]);
    const report = await buildInsightsReport('owner', query);
    expect(report.summary.expenses.percentChange).toBeNull();
    expect(report.summary.income.percentChange).toBe(0);
  });
  it('groups categories beyond the top five into Other and caps receivers at ten', async () => {
    transactions.mockResolvedValueOnce(
      Array.from({length: 12}, (_, i) =>
        row(`transaction-${i}`, -(i + 1), `category-${i}`, '2026-01-01T12:00:00Z', `Shop-${i}`),
      ),
    );
    const report = await buildInsightsReport('owner', {...query, $comparison: 'none'});
    expect(report.categoryTimeline).toHaveLength(6);
    expect(report.categoryTimeline[5]).toMatchObject({categoryId: null, label: 'Other', values: [28, 28, 28]});
    expect(report.receivers).toHaveLength(10);
    expect(report.receivers[0]).toMatchObject({receiver: 'Shop-11'});
  });
  it.each([
    ['2026-01-01', '2026-01-03', 'auto', 'day'],
    ['2026-01-01', '2026-03-01', 'auto', 'week'],
    ['2026-01-01', '2026-12-31', 'auto', 'month'],
    ['2026-01-01', '2026-01-03', 'week', 'week'],
    ['2026-01-01', '2026-01-03', 'month', 'month'],
  ] as const)('chooses %s to %s at %s as %s buckets', async (from, to, granularity, expected) => {
    const report = await buildInsightsReport('owner', {
      $dateFrom: new Date(`${from}T12:00:00Z`),
      $dateTo: new Date(`${to}T12:00:00Z`),
      $granularity: granularity,
      $comparison: 'none',
    });
    expect(report.granularity).toBe(expected);
    expect(report.timeline.length).toBeGreaterThan(0);
    expect(report.timeline[0].from).toEqual(new Date(`${from}T00:00:00Z`));
    expect(report.timeline.at(-1)!.to).toEqual(new Date(`${to}T23:59:59.999Z`));
    if (expected === 'week') expect(report.timeline[0].label).toMatch(/^W\d{2} 202/);
    if (expected === 'month') expect(report.timeline[0].label).toBe('2026-01');
  });
  it('calculates include/exclude budgets from current month negative transactions only', async () => {
    vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
    transactions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([row('rent', -120), row('other', -20, 'category-2'), row('income', 500)]);
    budgets.mockResolvedValue([
      {id: 'include', name: 'Rent', type: 'i', budget: 100, categories: [{categoryId: 'category-1'}]},
      {id: 'exclude', name: 'Other', type: 'e', budget: 0, categories: [{categoryId: 'category-1'}]},
    ]);
    const report = await buildInsightsReport('owner', query);
    expect(report.budgets).toEqual([
      {id: 'include', name: 'Rent', budget: 100, spent: 120, remaining: -20, utilization: 120, overBudget: true},
      {id: 'exclude', name: 'Other', budget: 0, spent: 20, remaining: -20, utilization: 0, overBudget: true},
    ]);
    expect(new PgDialect().sqlToQuery(budgets.mock.calls[0][0].where).params).toContain('owner');
  });
});
