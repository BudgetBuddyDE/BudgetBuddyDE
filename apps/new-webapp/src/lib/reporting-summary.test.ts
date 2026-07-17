import {describe, expect, it} from 'vitest';
import {plannedRecurringExpenses, summarizePeriodCategories, summarizeYear} from './reporting-summary';

describe('reporting summaries', () => {
  it('fills missing calendar months without losing yearly totals', () => {
    const result = summarizeYear(
      [{date: new Date(2026, 1, 28), income: 100, expenses: 40, balance: 60}] as never,
      2026,
    );
    expect(result).toHaveLength(12);
    expect(result[0]).toMatchObject({income: 0, expenses: 0});
    expect(result[1]).toMatchObject({income: 100, balance: 60});
  });

  it('isolates the selected period category totals', () => {
    const rows = [
      {date: new Date(2026, 6, 31), expenses: 20, income: 0, category: {id: 'c', name: 'Food'}},
      {date: new Date(2026, 7, 31), expenses: 50, income: 0, category: {id: 'c', name: 'Food'}},
    ] as never;
    expect(summarizePeriodCategories(rows, '2026-07')[0]?.expenses).toBe(20);
  });

  it('projects recurring schedules by interval and excludes paused income', () => {
    const items = [
      {paused: false, transferAmount: -100, interval: 'quarterly', nextExecutionAt: new Date(2026, 6, 1)},
      {paused: true, transferAmount: -50, interval: 'monthly', nextExecutionAt: new Date(2026, 6, 1)},
      {paused: false, transferAmount: 200, interval: 'monthly', nextExecutionAt: new Date(2026, 6, 1)},
    ] as never;
    expect(plannedRecurringExpenses(items, '2026-10')).toBe(100);
    expect(plannedRecurringExpenses(items, '2026-08')).toBe(0);
  });
});
