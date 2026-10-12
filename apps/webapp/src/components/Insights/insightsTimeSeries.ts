import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import type {IGetInsightsReportQuery} from '@budgetbuddyde/api/interfaces';
import type {ChartDataRow, HeatmapDataPoint, WaterfallDataPoint} from '@budgetbuddyde/charts';

const DAY_MS = 86_400_000;
const currency = (value: number) => Math.round(value * 100) / 100;

export function cashflowBridge(report: TInsightsReport): WaterfallDataPoint[] {
  let remaining = currency(report.summary.expenses.value);
  const categories = [...report.categories]
    .filter(row => row.expenses.value > 0)
    .sort((a, b) => b.expenses.value - a.expenses.value || a.category.id.localeCompare(b.category.id))
    .slice(0, 5)
    .flatMap(row => {
      const value = Math.min(remaining, currency(row.expenses.value));
      remaining = currency(remaining - value);
      return value > 0 ? [{label: row.category.name, value: -value}] : [];
    });
  return [
    {label: 'Income', value: report.summary.income.value},
    ...categories,
    ...(remaining > 0 ? [{label: 'Other expenses', value: -remaining}] : []),
    {label: 'Net cash flow', value: report.summary.balance.value, isTotal: true},
  ];
}

export function savingsRateTimeline(timeline: TInsightsReport['timeline']): ChartDataRow[] {
  return timeline.map(row => ({
    label: row.label,
    savingsRate: row.income > 0 ? (100 * row.balance) / row.income : null,
  }));
}

export function categoryExpenseTimeline(report: TInsightsReport, cumulative: boolean): ChartDataRow[] {
  return report.timeline.map((row, index) => {
    const result: ChartDataRow = {label: row.label};
    report.categoryTimeline.forEach((series, seriesIndex) => {
      const current = series.values[index];
      const previous = index === 0 ? 0 : series.values[index - 1];
      result[`category-${seriesIndex}`] =
        current === undefined || (!cumulative && previous === undefined)
          ? null
          : cumulative
            ? current
            : currency(current - previous!);
    });
    return result;
  });
}

export function reportCalendarDate(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (name: string) => parts.find(value => value.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

const addCalendarDays = (date: string, days: number): string =>
  new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** A local noon avoids DST gaps and keeps the query on the requested business date. */
function businessDateInstant(date: string, timezone: string): Date {
  const wanted = Date.parse(`${date}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  let instant = wanted;
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const parts = formatter.formatToParts(new Date(instant));
    const part = (name: string) => Number(parts.find(value => value.type === name)!.value);
    const observed = Date.UTC(
      part('year'),
      part('month') - 1,
      part('day'),
      part('hour'),
      part('minute'),
      part('second'),
    );
    instant += wanted - observed;
  }
  return new Date(instant);
}

export function dailyExpenseQuery(report: TInsightsReport, query: IGetInsightsReportQuery): IGetInsightsReportQuery {
  const timezone = report.timezone ?? 'Europe/Berlin';
  const to = reportCalendarDate(report.period.to, timezone);
  const from = reportCalendarDate(report.period.from, timezone);
  const limitedFrom = addCalendarDays(to, -83);
  return {
    ...query,
    $dateFrom: businessDateInstant(from > limitedFrom ? from : limitedFrom, timezone),
    $dateTo: businessDateInstant(to, timezone),
    $granularity: 'day',
    $comparison: 'none',
  };
}

export type DailyExpenseCell = HeatmapDataPoint & {date: string | null};

export function dailyExpenseCalendar(report: TInsightsReport) {
  const timezone = report.timezone ?? 'Europe/Berlin';
  const from = reportCalendarDate(report.period.from, timezone);
  const to = reportCalendarDate(report.period.to, timezone);
  const limitedFrom = addCalendarDays(to, -83);
  const start = from > limitedFrom ? from : limitedFrom;
  const weekday = (date: string) => (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
  const firstMonday = addCalendarDays(start, -weekday(start));
  const lastSunday = addCalendarDays(to, 6 - weekday(to));
  const xLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const yLabels: string[] = [];
  const days = new Map(report.timeline.map(row => [reportCalendarDate(row.from, timezone), row.expenses]));
  const data: DailyExpenseCell[] = [];
  for (let date = firstMonday; date <= lastSunday; date = addCalendarDays(date, 1)) {
    const column = weekday(date);
    const week = addCalendarDays(date, -column);
    if (column === 0) yLabels.push(week);
    const included = date >= start && date <= to;
    data.push({
      x: xLabels[column],
      y: week,
      value: included ? (days.get(date) ?? null) : null,
      date: included ? date : null,
    });
  }
  return {data, xLabels, yLabels, from: start, to, timezone};
}
