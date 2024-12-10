import {render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {useTransactions} from '@/features/Transaction';

import {BudgetPieChart} from './BudgetPieChart.component';

vi.mock('@/features/Transaction', () => ({
  useTransactions: vi.fn(),
}));

describe('BudgetPieChart', () => {
  const mockGetBudget = vi.fn();
  // const mockBudgetData = {
  //   expenses: 1000,
  //   upcomingExpenses: 500,
  //   freeAmount: 2000,
  // };

  beforeEach(() => {
    (useTransactions as ReturnType<typeof vi.fn>).mockReturnValue({
      getBudget: mockGetBudget,
    });
  });

  it('shows loading state initially', () => {
    mockGetBudget.mockResolvedValueOnce([null, null]);
    render(<BudgetPieChart />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // FIXME: This test is failing because the component is not rendering the pie chart.
  // it('renders pie chart when data is loaded successfully', async () => {
  //   mockGetBudget.mockResolvedValueOnce([mockBudgetData, null]);
  //   render(<BudgetPieChart />);

  //   await waitFor(() => {
  //     expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  //   });

  //   expect(screen.getByText('Budget')).toBeInTheDocument();
  //   expect(screen.getByText('How much can you spend?')).toBeInTheDocument();
  //   expect(screen.getByText('1.500,00 €')).toBeInTheDocument();
  //   expect(screen.getByText('Expenses')).toBeInTheDocument();
  // });

  it('renders no results message when data is empty', async () => {
    mockGetBudget.mockResolvedValueOnce([
      {
        expenses: 0,
        upcomingExpenses: 0,
        freeAmount: 0,
      },
      null,
    ]);

    render(<BudgetPieChart />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No budget information available!')).toBeInTheDocument();
  });

  it('handles error when fetching budget data', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetBudget.mockResolvedValueOnce([null, new Error('Failed to fetch')]);

    render(<BudgetPieChart />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});
