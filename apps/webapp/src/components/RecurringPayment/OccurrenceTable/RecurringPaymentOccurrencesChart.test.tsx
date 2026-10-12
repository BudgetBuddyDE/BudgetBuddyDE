import type {TRecurringPaymentOccurrence} from '@budgetbuddyde/api/recurringPayment';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {OccurrenceRange} from './occurrenceRange';
import {RecurringPaymentOccurrencesChart} from './RecurringPaymentOccurrencesChart';

const getOccurrences = vi.hoisted(() => vi.fn());
vi.mock('@/apiClient', () => ({apiClient: {backend: {recurringPayment: {getOccurrences}}}}));
vi.mock('@budgetbuddyde/charts', () => ({
  BarChart: ({data}: {data: unknown}) => <div data-testid="payment-plan">{JSON.stringify(data)}</div>,
}));
const range: OccurrenceRange = {
  dateFrom: '2026-03-28',
  dateTo: '2026-03-31',
  includePaused: false,
  categories: [],
  paymentMethods: [],
};
const occurrence = (scheduledFor: string, transferAmount: number, id = 'schedule-1'): TRecurringPaymentOccurrence => ({
  scheduledFor,
  recurringPayment: {transferAmount, id} as TRecurringPaymentOccurrence['recurringPayment'],
});
afterEach(() => vi.resetAllMocks());

describe('RecurringPaymentOccurrencesChart', () => {
  it('shows errors without partial charts and reloads every page on retry', async () => {
    const first = Array.from({length: 100}, (_, index) => occurrence('2026-03-28', -1, `schedule-${index}`));
    getOccurrences
      .mockResolvedValueOnce([{data: first, totalCount: 101}, null])
      .mockResolvedValueOnce([null, {message: 'Page failed'}]);
    const select = vi.fn();
    render(<RecurringPaymentOccurrencesChart range={range} onSelectRange={select} />);
    expect(await screen.findByText('Page failed')).toBeInTheDocument();
    expect(screen.queryByTestId('payment-plan')).not.toBeInTheDocument();
    getOccurrences
      .mockResolvedValueOnce([{data: first, totalCount: 101}, null])
      .mockResolvedValueOnce([{data: [occurrence('2026-03-29', 20)], totalCount: 101}, null]);
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}));
    await screen.findByTestId('payment-plan');
    expect(getOccurrences).toHaveBeenCalledTimes(4);
    fireEvent.click(screen.getAllByRole('button', {name: /expenses.*income/})[0]);
    expect(select).toHaveBeenCalledWith('2026-03-28', '2026-03-28');
    fireEvent.click(screen.getByRole('button', {name: 'Weekly'}));
    expect(screen.getByTestId('payment-plan')).toHaveTextContent('"dateTo":"2026-03-29"');
  });

  it('ignores stale responses after the filter context changes', async () => {
    let resolveOld!: (value: unknown) => void;
    getOccurrences
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce([{data: [occurrence('2026-04-01', -10)], totalCount: 1}, null]);
    const {rerender} = render(<RecurringPaymentOccurrencesChart range={range} onSelectRange={vi.fn()} />);
    rerender(
      <RecurringPaymentOccurrencesChart
        range={{...range, dateFrom: '2026-04-01', dateTo: '2026-04-01'}}
        onSelectRange={vi.fn()}
      />,
    );
    await screen.findByTestId('payment-plan');
    resolveOld([{data: [occurrence('2026-03-28', -999)], totalCount: 1}, null]);
    await waitFor(() => expect(screen.getByTestId('payment-plan')).toHaveTextContent('"expenses":10'));
    expect(screen.getByTestId('payment-plan')).not.toHaveTextContent('999');
  });
});
