import {MantineProvider} from '@mantine/core';
import {fireEvent, render, screen} from '@testing-library/react';
import type {ReactNode} from 'react';
import {describe, expect, it} from 'vitest';
import {BudgetList, type BudgetListItem} from './BudgetList';

function TestProvider({children}: {children: ReactNode}) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

const budgets: BudgetListItem[] = Array.from({length: 31}, (_, index) => ({
  id: `budget-${index}`,
  name: `Budget ${index + 1}`,
  type: index === 0 ? 'e' : 'i',
  balance: index === 0 ? 125 : index === 1 ? -10 : 25,
  budget: 100,
  categories: [{id: 'groceries', name: 'Lebensmittel'}],
}));

describe('BudgetList', () => {
  it('renders metadata, status and German euro amounts without entity actions', () => {
    render(<BudgetList data={budgets.slice(0, 2)} slots={{card: {className: 'budget-card'}}} />, {
      wrapper: TestProvider,
    });

    expect(screen.getByRole('heading', {name: 'Budgets'}).closest('section')).toHaveClass('budget-card');
    expect(screen.getByText('Keep on track with your spending')).toBeInTheDocument();
    expect(screen.getByText('Include')).toBeInTheDocument();
    expect(screen.getByText('Exclude')).toBeInTheDocument();
    expect(screen.getAllByText('Lebensmittel')).toHaveLength(2);
    expect(screen.getByText(/125,00\s€ \/ 100,00\s€/)).toBeInTheDocument();
    expect(screen.getByText(/0,00\s€ \/ 100,00\s€/)).toBeInTheDocument();
    expect(screen.getByText('Over budget')).toBeInTheDocument();
    expect(screen.getByText('Within budget')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /Add|Edit|Delete/})).not.toBeInTheDocument();
  });

  it('changes pages and resets to the first page when the page size changes', () => {
    render(<BudgetList data={budgets} />, {wrapper: TestProvider});

    expect(screen.getByRole('combobox', {name: 'Rows:'})).toHaveValue('10');
    expect(screen.getByText('Budget 10')).toBeInTheDocument();
    expect(screen.queryByText('Budget 11')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Next page'}));
    expect(screen.getByText('Budget 11')).toBeInTheDocument();
    expect(screen.queryByText('Budget 1')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', {name: 'Rows:'}), {target: {value: '25'}});
    expect(screen.getByText('Budget 1')).toBeInTheDocument();
    expect(screen.getByText('Budget 25')).toBeInTheDocument();
    expect(screen.queryByText('Budget 26')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Next page'}));
    expect(screen.getByText('Budget 31')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
  });

  it('clamps the stored page when data shrinks, including an empty result', () => {
    const {rerender} = render(<BudgetList data={budgets} />, {wrapper: TestProvider});
    fireEvent.click(screen.getByRole('button', {name: 'Next page'}));
    fireEvent.click(screen.getByRole('button', {name: 'Next page'}));
    rerender(<BudgetList data={budgets.slice(0, 16)} />);
    expect(screen.getByText('Budget 16')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
    rerender(<BudgetList data={[]} />);
    expect(screen.getByText('There are no budgets')).toBeInTheDocument();
    rerender(<BudgetList data={budgets} />);
    expect(screen.getByText('Budget 1')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Previous page'})).toBeDisabled();
  });

  it('supports loading, empty messages and header overrides', () => {
    const {rerender} = render(<BudgetList data={budgets} isLoading />, {wrapper: TestProvider});
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('Budget 1')).not.toBeInTheDocument();
    rerender(<BudgetList data={[]} title="My budgets" subtitle="Monthly limits" noResultsMessage="Nothing here" />);
    expect(screen.getByRole('heading', {name: 'My budgets'})).toBeInTheDocument();
    expect(screen.getByText('Monthly limits')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
