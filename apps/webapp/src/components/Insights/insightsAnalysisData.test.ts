import {describe, expect, it} from 'vitest';
import {categoryComparisonData, insightsTransactionHref, paymentUsageData} from './insightsAnalysisData';
import {buildReport, metric} from './InsightsReport.fixtures';

describe('insights analysis data', () => {
  it('ranks changes by their absolute amount, preserving decreases and missing comparisons', () => {
    const rows = buildReport().categories;
    rows[0].expenses = metric(5, null, 100);
    rows[1].expenses = metric(150, null, 100);
    expect(categoryComparisonData(rows, 'expenses', true)).toEqual([
      expect.objectContaining({label: 'Groceries', current: 5, previous: 100, change: -95}),
      expect.objectContaining({label: 'Housing', current: 150, previous: 100, change: 50}),
    ]);
    expect(categoryComparisonData(rows, 'expenses', false)[0].label).toBe('Housing');
    rows[0].expenses = metric(5);
    expect(categoryComparisonData(rows, 'expenses', true)[1].previous).toBeNull();
  });

  it('sorts payment methods by the selected unit without mutating the report', () => {
    const report = buildReport();
    expect(paymentUsageData(report, 'count').map(row => row.label)).toEqual(['Card', 'Cash']);
    expect(paymentUsageData(report, 'expenses').map(row => row.label)).toEqual(['Cash', 'Card']);
    expect(report.paymentMethods[0].paymentMethod.name).toBe('Card');
  });

  it('converts report filters to transaction params and safely encodes receiver searches', () => {
    const href = insightsTransactionHref(
      buildReport(),
      {
        $dateFrom: new Date(2026, 1, 1),
        $dateTo: new Date(2026, 1, 28),
        $categories: ['cat-1'],
        $paymentMethods: ['pm-1', 'pm-2'],
      },
      {keyword: 'Shop & Sons? #1', categories: ['cat-2']},
    );
    const params = new URL(href, 'https://example.test').searchParams;
    expect(params.get('dateFrom')).toBe('2026-02-01');
    expect(params.get('dateTo')).toBe('2026-02-28');
    expect(params.get('cat')).toBe('cat-2');
    expect(params.get('pm')).toBe('pm-1,pm-2');
    expect(params.get('q')).toBe('Shop & Sons? #1');
    expect(params.has('from')).toBe(false);
  });

  it('uses the report business timezone when no original filter query is available', () => {
    const report = buildReport({
      timezone: 'Europe/Berlin',
      period: {
        from: new Date('2026-02-28T23:00:00Z'),
        to: new Date('2026-03-31T21:59:59.999Z'),
      },
    });
    const params = new URL(insightsTransactionHref(report), 'https://example.test').searchParams;
    expect(params.get('dateFrom')).toBe('2026-03-01');
    expect(params.get('dateTo')).toBe('2026-03-31');
  });
});
