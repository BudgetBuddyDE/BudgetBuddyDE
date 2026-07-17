import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {AnalyticsWorkspace} from './analytics-workspace';
const push = vi.fn();
vi.mock('next/navigation', () => ({useRouter: () => ({push, refresh: vi.fn()})}));
const data = {
  history: [{date: new Date(2026, 6, 31), income: 1000, expenses: 400, balance: 600}],
  categoryHistory: [
    {date: new Date(2026, 6, 31), income: 0, expenses: 400, balance: -400, category: {id: 'c', name: 'Food'}},
  ],
  recurring: [{paused: false, transferAmount: -100, interval: 'monthly', nextExecutionAt: new Date(2026, 6, 1)}],
} as never;

describe('AnalyticsWorkspace', () => {
  it('renders selected period totals, category activity, comparison and export', () => {
    render(<AnalyticsWorkspace data={data} period="2026-07" />);
    expect(screen.getByText('Planned recurring vs actual expenses')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /Export month/})).toHaveAttribute(
      'href',
      '/api/export/transactions?format=csv&period=2026-07',
    );
  });
  it('navigates months through URL state', () => {
    render(<AnalyticsWorkspace data={data} period="2026-07" />);
    fireEvent.click(screen.getByRole('button', {name: 'Next month'}));
    expect(push).toHaveBeenCalledWith('/analytics?period=2026-08');
  });
});
