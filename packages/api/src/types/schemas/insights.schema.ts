import z from 'zod';
import {Category} from './category.schema';
import {ApiResponse} from './common.schema';
import {PaymentMethod} from './paymentMethod.schema';

export const HistoricalBalance = z.object({
  date: z.iso.datetime().or(z.date()),
  income: z.number(),
  expenses: z.number(),
  balance: z.number(),
});

export const HistoricalCategoryBalance = HistoricalBalance.extend({
  category: Category.pick({
    id: true,
    name: true,
    description: true,
  }),
});

export const GetHistoricalBalanceResponse = ApiResponse.extend({
  data: z.array(HistoricalBalance),
});

export const GetHistoricalCategoryBalanceResponse = ApiResponse.extend({
  data: z.array(HistoricalCategoryBalance),
});

export const InsightsGranularity = z.enum(['auto', 'day', 'week', 'month']);
export const InsightsComparison = z.enum(['previous', 'none']);

export const InsightsReportQuery = z.object({
  $dateFrom: z.coerce.date(),
  $dateTo: z.coerce.date(),
  $categories: z.array(Category.shape.id).optional(),
  $paymentMethods: z.array(PaymentMethod.shape.id).optional(),
  $granularity: InsightsGranularity.default('auto'),
  $comparison: InsightsComparison.default('previous'),
});

export const InsightsMetric = z.object({
  value: z.number(),
  previousValue: z.number().nullable(),
  absoluteChange: z.number().nullable(),
  percentChange: z.number().nullable(),
});

const ReportPeriod = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

const ReportCategory = Category.pick({
  id: true,
  name: true,
  description: true,
});
const ReportPaymentMethod = PaymentMethod.pick({
  id: true,
  name: true,
  provider: true,
});

const CategoryTimelineSeries = z.object({
  categoryId: Category.shape.id.nullable(),
  label: z.string(),
  values: z.array(z.number()),
});

export const InsightsReport = z.object({
  period: ReportPeriod,
  comparisonPeriod: ReportPeriod.nullable(),
  granularity: z.enum(['day', 'week', 'month']),
  summary: z.object({
    income: InsightsMetric,
    expenses: InsightsMetric,
    balance: InsightsMetric,
    savingsRate: InsightsMetric,
    transactionCount: InsightsMetric,
    averageExpense: InsightsMetric,
  }),
  timeline: z.array(
    z.object({
      from: z.coerce.date(),
      to: z.coerce.date(),
      label: z.string(),
      income: z.number(),
      expenses: z.number(),
      balance: z.number(),
      cumulativeExpenses: z.number(),
      cumulativeBalance: z.number(),
      previousIncome: z.number().nullable(),
      previousExpenses: z.number().nullable(),
      previousBalance: z.number().nullable(),
    }),
  ),
  categoryTimeline: z.array(CategoryTimelineSeries),
  categories: z.array(
    z.object({
      category: ReportCategory,
      income: InsightsMetric,
      expenses: InsightsMetric,
      balance: InsightsMetric,
      transactionCount: InsightsMetric,
      averageExpense: InsightsMetric,
      expenseShare: z.number(),
    }),
  ),
  paymentMethods: z.array(
    z.object({
      paymentMethod: ReportPaymentMethod,
      transactionCount: InsightsMetric,
      income: InsightsMetric,
      expenses: InsightsMetric,
      balance: InsightsMetric,
      usageShare: z.number(),
      lastUsedAt: z.coerce.date().nullable(),
    }),
  ),
  receivers: z.array(
    z.object({
      receiver: z.string(),
      expenses: InsightsMetric,
      transactionCount: InsightsMetric,
      averageExpense: InsightsMetric,
    }),
  ),
  budgets: z
    .array(
      z.object({
        id: z.uuid(),
        name: z.string(),
        budget: z.number(),
        spent: z.number(),
        remaining: z.number(),
        utilization: z.number(),
        overBudget: z.boolean(),
      }),
    )
    .nullable(),
});

export const GetInsightsReportResponse = ApiResponse.extend({
  data: InsightsReport,
});
