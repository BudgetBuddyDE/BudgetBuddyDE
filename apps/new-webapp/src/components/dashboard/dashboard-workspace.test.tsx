import {fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {DashboardWorkspace} from './dashboard-workspace';

const mocks = vi.hoisted(() => ({push: vi.fn(), refresh: vi.fn()}));
vi.mock('next/navigation', () => ({useRouter: () => mocks}));
const data = {
  history: [{date: new Date(), income: 1000, expenses: 250, balance: 750}],
  categoryHistory: [
    {date: new Date(), income: 0, expenses: 250, balance: -250, category: {id: 'c', name: 'Food', description: null}},
  ],
  recentTransactions: [{id: 't', receiver: 'Market', information: null, processedAt: new Date(), transferAmount: -25}],
  budgets: [{id: 'b', name: 'Food', budget: 200, balance: 250}],
  upcoming: [{id: 'r', receiver: 'Rent', information: null, nextExecutionAt: new Date(), transferAmount: -500}],
} as never;

describe('DashboardWorkspace', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders KPIs, category ranking, budget warnings, and operational lists', () => {
    render(<DashboardWorkspace data={data} period="2026-07" />);
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getAllByText('Food')).toHaveLength(2);
    expect(screen.getByText(/125%.*exceeded/)).toBeInTheDocument();
    expect(screen.getByText('Market')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
  });

  it('persists month navigation in the URL', () => {
    render(<DashboardWorkspace data={data} period="2026-01" />);
    fireEvent.click(screen.getByRole('button', {name: 'Previous month'}));
    expect(mocks.push).toHaveBeenCalledWith('/dashboard?period=2025-12');
  });
});
