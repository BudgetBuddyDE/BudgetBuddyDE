import {describe, expect, it} from 'vitest';
import {GetInsightsReportResponse} from './insights.schema';

const report = {
  period: {from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T23:59:59.999Z'},
  comparisonPeriod: null,
  granularity: 'month' as const,
  summary: {
    income: {value: 0, previousValue: null, absoluteChange: null, percentChange: null},
    expenses: {value: 0, previousValue: null, absoluteChange: null, percentChange: null},
    balance: {value: 0, previousValue: null, absoluteChange: null, percentChange: null},
    savingsRate: {value: 0, previousValue: null, absoluteChange: null, percentChange: null},
    transactionCount: {value: 0, previousValue: null, absoluteChange: null, percentChange: null},
    averageExpense: {value: 0, previousValue: null, absoluteChange: null, percentChange: null},
  },
  timeline: [],
  categoryTimeline: [
    {categoryId: '11111111-1111-4111-8111-111111111111', label: 'Food', values: [10]},
    {categoryId: '22222222-2222-4222-8222-222222222222', label: 'Housing', values: [8]},
    {categoryId: '33333333-3333-4333-8333-333333333333', label: 'Transport', values: [6]},
    {categoryId: '44444444-4444-4444-8444-444444444444', label: 'Health', values: [4]},
    {categoryId: '55555555-5555-4555-8555-555555555555', label: 'Leisure', values: [3]},
    {categoryId: '66666666-6666-4666-8666-666666666666', label: 'Shopping', values: [2]},
    {categoryId: null, label: 'Other', values: [2]},
  ],
  categories: [],
  paymentMethods: [],
  receivers: [],
  budgets: null,
};

describe('GetInsightsReportResponse', () => {
  it('accepts more than five real category UUIDs and a null id for the aggregated Other series', () => {
    expect(GetInsightsReportResponse.safeParse({status: 200, data: report}).success).toBe(true);
  });

  it('rejects the synthetic Other string as a category id', () => {
    const invalid = {
      ...report,
      categoryTimeline: [{categoryId: 'other', label: 'Other', values: [2]}],
    };

    expect(GetInsightsReportResponse.safeParse({status: 200, data: invalid}).success).toBe(false);
  });
});
