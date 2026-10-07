import {MantineProvider} from '@mantine/core';
import {fireEvent, render, screen} from '@testing-library/react';
import type {ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {TransactionList} from './TransactionList';

function TestProvider({children}: {children: ReactNode}) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

const transactions = [
  {
    id: 'openai',
    receiver: 'OpenAI',
    processedAt: new Date(2026, 9, 6, 12),
    transferAmount: -23,
    category: {id: 'subscription', name: 'Abonnement'},
    paymentMethod: {id: 'n26', name: 'Debitcard (N26, Hauptkonto)'},
  },
];

describe('TransactionList', () => {
  it('renders transaction metadata and formats the amount in German euros', () => {
    render(<TransactionList data={transactions} />, {wrapper: TestProvider});

    expect(screen.getByRole('heading', {name: 'Transactions'})).toBeInTheDocument();
    expect(screen.getByText('Your latest transactions')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('06.10')).toBeInTheDocument();
    expect(screen.getByText('Abonnement')).toBeInTheDocument();
    expect(screen.getByText('Debitcard (N26, Hauptkonto)')).toBeInTheDocument();
    expect(screen.getByText(/-23,00\s€/)).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Add Transactions'})).not.toBeInTheDocument();
  });

  it('shows the empty message and forwards the add callback and Card props', () => {
    const onAddEntity = vi.fn();
    render(<TransactionList data={[]} onAddEntity={onAddEntity} className="latest-transactions" />, {
      wrapper: TestProvider,
    });

    expect(screen.getByText("You haven't made any purchases yet")).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Transactions'}).closest('section')).toHaveClass('latest-transactions');
    fireEvent.click(screen.getByRole('button', {name: 'Add Transactions'}));
    expect(onAddEntity).toHaveBeenCalledOnce();
  });

  it('uses a caller-provided header action in place of the add action', () => {
    render(<TransactionList data={[]} onAddEntity={vi.fn()} headerAction={<button>Export</button>} />, {
      wrapper: TestProvider,
    });

    expect(screen.getByRole('button', {name: 'Export'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Add Transactions'})).not.toBeInTheDocument();
  });
});
