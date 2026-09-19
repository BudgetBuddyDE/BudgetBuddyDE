import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedTransaction} from '@budgetbuddyde/api/types';

export type InsightsMetric = TInsightsReport['summary']['income'];

export const asCategoryId = (id: string): TCategoryVH['id'] => id as TCategoryVH['id'];
export const asPaymentMethodId = (id: string): TPaymentMethodVH['id'] => id as TPaymentMethodVH['id'];

export const metric = (
  value: number,
  percentChange: number | null = null,
  previousValue: number | null = null,
): InsightsMetric => ({
  value,
  previousValue,
  absoluteChange: previousValue === null ? null : value - previousValue,
  percentChange,
});

export const categoryOption = (id: string, name: string): TCategoryVH => ({
  id: asCategoryId(id),
  name,
  description: null,
});

export const paymentMethodOption = (id: string, name: string): TPaymentMethodVH => ({
  id: asPaymentMethodId(id),
  name,
  provider: 'Provider',
  address: 'Street 1',
  description: null,
});

const categoryRow = (id: string, name: string, expenseShare: number, expenseValue: number, incomeValue: number) =>
  ({
    category: {id: asCategoryId(id), name, description: null},
    income: metric(incomeValue, 10, incomeValue - 100),
    expenses: metric(expenseValue, 8, expenseValue + 10),
    balance: metric(incomeValue - expenseValue, 12, incomeValue - expenseValue - 10),
    transactionCount: metric(10, 2, 8),
    averageExpense: metric(12.05, 1, 13),
    expenseShare,
  }) as TInsightsReport['categories'][number];

const paymentMethodRow = (
  id: string,
  name: string,
  uses: number,
  expenseValue: number,
): TInsightsReport['paymentMethods'][number] => ({
  paymentMethod: {id: asPaymentMethodId(id), name, provider: 'Provider'},
  transactionCount: metric(uses, 1, uses - 1),
  income: metric(200, 5, 190),
  expenses: metric(expenseValue, 5, expenseValue - 10),
  balance: metric(200 - expenseValue, 5, 180 - expenseValue),
  usageShare: 50,
  lastUsedAt: new Date('2026-02-01T12:00:00.000Z'),
});

export const buildReport = (overrides: Partial<TInsightsReport> = {}): TInsightsReport => ({
  period: {from: new Date('2026-01-01T00:00:00.000Z'), to: new Date('2026-12-31T00:00:00.000Z')},
  comparisonPeriod: {from: new Date('2025-01-01T00:00:00.000Z'), to: new Date('2025-12-31T00:00:00.000Z')},
  granularity: 'month',
  summary: {
    income: metric(1200, 10, 1000),
    expenses: metric(300, -5, 350),
    balance: metric(900, 15, 650),
    savingsRate: metric(21.5, 2.1, 19.4),
    transactionCount: metric(42, 5, 40),
    averageExpense: metric(30, -2, 32),
  },
  timeline: [
    {
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T00:00:00.000Z'),
      label: 'Jan 2026',
      income: 1200,
      expenses: 300,
      balance: 900,
      cumulativeExpenses: 300,
      cumulativeBalance: 900,
      previousIncome: 1000,
      previousExpenses: 350,
      previousBalance: 650,
    },
  ],
  categoryTimeline: [],
  categories: [categoryRow('cat-1', 'Groceries', 40.2, 120.5, 600), categoryRow('cat-2', 'Housing', 59.8, 95, 400)],
  paymentMethods: [paymentMethodRow('pm-1', 'Card', 5, 80), paymentMethodRow('pm-2', 'Cash', 2, 140)],
  receivers: [],
  budgets: null,
  ...overrides,
});

export const buildTransaction = (id: number): TExpandedTransaction =>
  ({
    id: `01900000-0000-7000-8000-${String(id).padStart(12, '0')}`,
    ownerId: '01900000-0000-7000-8000-000000000001',
    processedAt: '2026-02-01T10:30:00.000Z',
    receiver: `Receiver ${id}`,
    transferAmount: 42.5,
    information: null,
    createdAt: '2026-02-01T10:30:00.000Z',
    updatedAt: '2026-02-01T10:30:00.000Z',
    category: {
      id: asCategoryId('cat-1'),
      ownerId: '01900000-0000-7000-8000-000000000001',
      name: 'Groceries',
      description: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    paymentMethod: {
      id: asPaymentMethodId('pm-1'),
      ownerId: '01900000-0000-7000-8000-000000000001',
      name: 'Card',
      provider: 'Provider',
      address: 'Street 1',
      description: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  }) as TExpandedTransaction;
