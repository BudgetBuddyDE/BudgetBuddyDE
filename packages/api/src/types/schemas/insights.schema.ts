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

/** Inclusive calendar-day limit; daily requests retain the same limit as other granularities. */
export const MAX_INSIGHTS_REPORT_DAYS = 3660;

const ReportDate = z.preprocess(value => {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const parsed = new Date(0);
      parsed.setUTCFullYear(year, month - 1, day);
      if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
        return new Date(NaN);
      }
    }
  }
  return value;
}, z.coerce.date());

export function refineInsightsReportRange(
  query: {$dateFrom: Date; $dateTo: Date},
  context: z.RefinementCtx,
  timezone = 'UTC',
): void {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const calendarDay = (date: Date) => {
    const parts = formatter.formatToParts(date);
    const value = (name: string) => Number(parts.find(part => part.type === name)!.value);
    return Date.UTC(value('year'), value('month') - 1, value('day')) / 86_400_000;
  };
  const days = calendarDay(query.$dateTo) - calendarDay(query.$dateFrom) + 1;
  if (days < 1) {
    context.addIssue({code: 'custom', path: ['$dateTo'], message: '$dateTo must be on or after $dateFrom'});
  } else if (days > MAX_INSIGHTS_REPORT_DAYS) {
    context.addIssue({
      code: 'custom',
      path: ['$dateTo'],
      message: `Date range must not exceed ${MAX_INSIGHTS_REPORT_DAYS} calendar days`,
    });
  }
}

export const InsightsReportQuery = z
  .object({
    $dateFrom: ReportDate,
    $dateTo: ReportDate,
    $categories: z.array(Category.shape.id).optional(),
    $paymentMethods: z.array(PaymentMethod.shape.id).optional(),
    $granularity: InsightsGranularity.default('auto'),
    $comparison: InsightsComparison.default('previous'),
  })
  .superRefine((query, context) => refineInsightsReportRange(query, context));

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
  timezone: z.string().optional(),
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
