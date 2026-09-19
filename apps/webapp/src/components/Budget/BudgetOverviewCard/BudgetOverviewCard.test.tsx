import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {BudgetOverviewCard} from './BudgetOverviewCard';

describe('BudgetOverviewCard', () => {
  it('renders the budget breakdown', () => {
    render(<BudgetOverviewCard totalBudget={200} spent={100} futureExpenses={40} />);

    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText(/200,00/)).toBeInTheDocument();
    expect(screen.getByText('Spent')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Expenses')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText(/60,00/)).toBeInTheDocument();
  });

  it('renders the overdrawn state', () => {
    render(<BudgetOverviewCard totalBudget={100} spent={80} futureExpenses={40} />);

    expect(screen.getByText('Overdrawn')).toBeInTheDocument();
    expect(screen.getByText(/20,00/)).toBeInTheDocument();
  });

  it('renders a zero budget without invalid percentage values', () => {
    render(<BudgetOverviewCard totalBudget={0} spent={0} futureExpenses={0} />);

    expect(screen.getByLabelText('Budget progress')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getAllByText(/0,00/)).not.toHaveLength(0);
  });
});
