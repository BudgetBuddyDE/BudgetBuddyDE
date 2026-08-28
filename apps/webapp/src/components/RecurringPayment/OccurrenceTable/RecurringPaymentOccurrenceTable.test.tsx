import type {TCategory} from '@budgetbuddyde/api/category';
import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import type {TRecurringPaymentOccurrence} from '@budgetbuddyde/api/recurringPayment';
import {render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {RecurringPaymentOccurrenceTable} from './RecurringPaymentOccurrenceTable';

const getOccurrences = vi.hoisted(() => vi.fn());

vi.mock('@/apiClient', () => ({
  apiClient: {backend: {recurringPayment: {getOccurrences}}},
}));

vi.mock('@/components/Form/DateRangePicker', () => ({DateRangePicker: () => <div>Date range</div>}));
vi.mock('@/components/Filter', () => ({FilterWrapper: () => null}));
vi.mock('@/components/Category/CategoryChip', () => ({CategoryChip: () => null}));
vi.mock('@/components/PaymentMethod/PaymentMethodChip', () => ({PaymentMethodChip: () => null}));
vi.mock('@/components/Table', () => ({
  EntityTable: ({slice}: {slice: {data: Array<{scheduledFor: string; recurringPayment: {receiver: string}}>}}) => (
    <div>
      {slice.data.map(row => (
        <div key={row.scheduledFor}>{`${row.scheduledFor} ${row.recurringPayment.receiver}`}</div>
      ))}
    </div>
  ),
}));

describe('RecurringPaymentOccurrenceTable', () => {
  it('loads and renders separate occurrences from the same schedule', async () => {
    const recurringPayment = {
      id: 'schedule-1',
      executionPlan: 'weekly',
      startsOn: '2026-08-01',
      paused: false,
      receiver: 'Gym',
      transferAmount: -25,
      category: {id: 'category-1', name: 'Health'},
      paymentMethod: {id: 'payment-method-1', name: 'Card'},
    } as TRecurringPaymentOccurrence['recurringPayment'];
    getOccurrences.mockResolvedValue([
      {
        data: [
          {scheduledFor: '2026-08-07', recurringPayment},
          {scheduledFor: '2026-08-14', recurringPayment},
        ],
        totalCount: 2,
      },
      null,
    ]);

    render(
      <RecurringPaymentOccurrenceTable
        initialRange={{
          dateFrom: '2026-08-01',
          dateTo: '2026-08-31',
          includePaused: false,
          categories: ['category-1' as TCategory['id']],
          paymentMethods: ['payment-method-1' as TPaymentMethod['id']],
        }}
      />,
    );

    await waitFor(() =>
      expect(getOccurrences).toHaveBeenCalledWith({
        $dateFrom: '2026-08-01',
        $dateTo: '2026-08-31',
        $includePaused: undefined,
        $categories: ['category-1'],
        $paymentMethods: ['payment-method-1'],
        from: 0,
        to: 15,
      }),
    );
    expect(await screen.findByText('2026-08-07 Gym')).toBeInTheDocument();
    expect(screen.getByText('2026-08-14 Gym')).toBeInTheDocument();
  });
});
