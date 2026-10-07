import {MantineProvider} from '@mantine/core';
import {fireEvent, render, screen} from '@testing-library/react';
import type {ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {RecurringPaymentList} from './RecurringPaymentList';

function TestProvider({children}: {children: ReactNode}) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

const recurringPayments = [
  {
    id: 'netflix',
    receiver: 'Netflix',
    nextExecution: new Date(2026, 9, 15, 12),
    transferAmount: 12.99,
    category: {id: 'subscription', name: 'Abonnement'},
    paymentMethod: {id: 'n26', name: 'Debitcard (N26, Hauptkonto)'},
  },
];

describe('RecurringPaymentList', () => {
  it('renders the next date and payment metadata with a formatted amount', () => {
    render(<RecurringPaymentList data={recurringPayments} />, {wrapper: TestProvider});

    expect(screen.getByRole('heading', {name: 'Upcoming recurring payments'})).toBeInTheDocument();
    expect(screen.getByText('Your upcoming recurring payments')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Next 15.10')).toBeInTheDocument();
    expect(screen.getByText('Abonnement')).toBeInTheDocument();
    expect(screen.getByText('Debitcard (N26, Hauptkonto)')).toBeInTheDocument();
    expect(screen.getByText(/12,99\s€/)).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Add Upcoming recurring payments'})).not.toBeInTheDocument();
  });

  it('shows the empty message and forwards the add callback and Card props', () => {
    const onAddEntity = vi.fn();
    render(<RecurringPaymentList data={[]} onAddEntity={onAddEntity} className="upcoming-payments" />, {
      wrapper: TestProvider,
    });

    expect(screen.getByText('There are no recurring payments')).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Upcoming recurring payments'}).closest('section')).toHaveClass(
      'upcoming-payments',
    );
    fireEvent.click(screen.getByRole('button', {name: 'Add Upcoming recurring payments'}));
    expect(onAddEntity).toHaveBeenCalledOnce();
  });
});
