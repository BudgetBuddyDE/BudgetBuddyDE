import {describe, expect, it} from 'vitest';
import {buildReport, metric} from './InsightsReport.fixtures';
import {
  cashflowBridge,
  categoryExpenseTimeline,
  dailyExpenseCalendar,
  dailyExpenseQuery,
  reportCalendarDate,
  savingsRateTimeline,
} from './insightsTimeSeries';

const bucket = buildReport().timeline[0];

describe('Insights time series adapters', () => {
  it('reconciles category contributions and the remainder with recorded expenses, including a deficit', () => {
    const report = buildReport({
      summary: {...buildReport().summary, income: metric(100), expenses: metric(300), balance: metric(-200)},
    });
    const rows = cashflowBridge(report);
    expect(rows).toEqual([
      {label: 'Income', value: 100},
      {label: 'Groceries', value: -120.5},
      {label: 'Housing', value: -95},
      {label: 'Other expenses', value: -84.5},
      {label: 'Net cash flow', value: -200, isTotal: true},
    ]);
    expect(rows.filter(row => !row.isTotal).reduce((sum, row) => sum + row.value, 0)).toBe(-200);
  });

  it('keeps zero-income periods as missing rates and permits negative percentages', () => {
    expect(
      savingsRateTimeline([
        {...bucket, label: 'A', income: 0, balance: -40},
        {...bucket, label: 'B', income: 100, balance: -30},
      ]),
    ).toEqual([
      {label: 'A', savingsRate: null},
      {label: 'B', savingsRate: -30},
    ]);
  });

  it('turns cumulative category values into bucket amounts without losing rounding precision or missing buckets', () => {
    const report = buildReport({
      timeline: [bucket, {...bucket, label: 'B'}, {...bucket, label: 'C'}],
      categoryTimeline: [{categoryId: null, label: 'Other', values: [10.1, 10.3]}],
    });
    expect(categoryExpenseTimeline(report, false)).toEqual([
      {label: 'Jan 2026', 'category-0': 10.1},
      {label: 'B', 'category-0': 0.2},
      {label: 'C', 'category-0': null},
    ]);
    expect(categoryExpenseTimeline(report, true)[1]['category-0']).toBe(10.3);
  });

  it('preserves category/payment filters and bounds daily requests to 84 business dates across DST', () => {
    const report = buildReport({
      timezone: 'Europe/Berlin',
      period: {from: new Date('2026-01-01T00:00:00Z'), to: new Date('2026-04-01T21:59:59Z')},
    });
    const query = dailyExpenseQuery(report, {$categories: ['cat-1'], $paymentMethods: ['pm-2']});
    expect(reportCalendarDate(query.$dateFrom!, 'Europe/Berlin')).toBe('2026-01-08');
    expect(reportCalendarDate(query.$dateTo!, 'Europe/Berlin')).toBe('2026-04-01');
    expect(query).toMatchObject({
      $granularity: 'day',
      $comparison: 'none',
      $categories: ['cat-1'],
      $paymentMethods: ['pm-2'],
    });
  });

  it('maps business days across midnight and DST; recorded zero and outside-period cells are distinct', () => {
    const report = buildReport({
      timezone: 'Europe/Berlin',
      granularity: 'day',
      period: {from: new Date('2026-03-28T23:00:00Z'), to: new Date('2026-03-30T21:59:59Z')},
      timeline: [
        {...bucket, from: new Date('2026-03-28T23:00:00Z'), expenses: 25},
        {...bucket, from: new Date('2026-03-29T22:00:00Z'), expenses: 0},
      ],
    });
    const calendar = dailyExpenseCalendar(report);
    expect(calendar.data.find(point => point.date === '2026-03-29')).toMatchObject({x: 'Sun', value: 25});
    expect(calendar.data.find(point => point.date === '2026-03-30')).toMatchObject({x: 'Mon', value: 0});
    expect(calendar.data.find(point => point.y === '2026-03-23' && point.x === 'Sat')).toMatchObject({
      date: null,
      value: null,
    });
  });

  it('leaves missing buckets hatched instead of claiming unrecorded expenses are zero', () => {
    const report = buildReport({
      granularity: 'day',
      timezone: 'Pacific/Kiritimati',
      period: {from: new Date('2026-01-01T10:00:00Z'), to: new Date('2026-01-02T09:59:59Z')},
      timeline: [],
    });
    const calendar = dailyExpenseCalendar(report);
    expect(calendar.from).toBe('2026-01-02');
    expect(calendar.data.find(point => point.date === '2026-01-02')?.value).toBeNull();
    const query = dailyExpenseQuery(report, {});
    expect(reportCalendarDate(query.$dateFrom!, 'Pacific/Kiritimati')).toBe('2026-01-02');
  });
});
