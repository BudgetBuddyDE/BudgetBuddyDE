import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import type {IGetInsightsReportQuery} from '@budgetbuddyde/api/interfaces';
import {serializeTransactionFilters} from '@/components/Filter';
import type {EntityFilters} from '@/lib/features/createEntitySlice';

export type CategoryMetric = 'expenses' | 'income' | 'balance';
export type PaymentMetric = 'count' | 'expenses';

function reportCalendarDate(date: Date, timezone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return new Date(value('year'), value('month') - 1, value('day'), 12);
}

export function categoryComparisonData(rows: TInsightsReport['categories'], metric: CategoryMetric, compare: boolean) {
  return rows
    .map(row => ({
      id: row.category.id,
      label: row.category.name,
      current: row[metric].value,
      previous: row[metric].previousValue,
      change: row[metric].absoluteChange,
    }))
    .sort((a, b) =>
      compare ? Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0) : Math.abs(b.current) - Math.abs(a.current),
    )
    .slice(0, 5);
}

export function paymentUsageData(report: TInsightsReport, metric: PaymentMetric) {
  return [...report.paymentMethods]
    .sort((a, b) =>
      metric === 'count' ? b.transactionCount.value - a.transactionCount.value : b.expenses.value - a.expenses.value,
    )
    .map(row => ({
      id: row.paymentMethod.id,
      label: row.paymentMethod.name,
      value: metric === 'count' ? row.transactionCount.value : row.expenses.value,
      row,
    }));
}

/** Preserve the loaded report's filters, not a newly selected query awaiting a response. */
export function insightsTransactionHref(
  report: TInsightsReport,
  query?: IGetInsightsReportQuery,
  overrides: Partial<EntityFilters> = {},
) {
  const filters: EntityFilters = {
    keyword: null,
    dateFrom: query?.$dateFrom ?? reportCalendarDate(report.period.from, report.timezone ?? 'Europe/Berlin'),
    dateTo: query?.$dateTo ?? reportCalendarDate(report.period.to, report.timezone ?? 'Europe/Berlin'),
    categories: query?.$categories ?? [],
    paymentMethods: query?.$paymentMethods ?? [],
    ...overrides,
  };
  return '/transactions?' + serializeTransactionFilters(filters).toString();
}
