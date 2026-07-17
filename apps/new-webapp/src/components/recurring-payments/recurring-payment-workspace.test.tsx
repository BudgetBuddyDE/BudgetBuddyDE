import type {TExpandedRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RecurringPaymentWorkspace} from './recurring-payment-workspace';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  pause: vi.fn(),
  execute: vi.fn(),
  remove: vi.fn(),
  save: vi.fn(),
}));
vi.mock('next/navigation', () => ({useRouter: () => ({push: mocks.push, refresh: mocks.refresh})}));
vi.mock('@/lib/recurring-payment-mutations', () => ({
  recurringPaymentToDraft: () => ({
    amount: '',
    type: 'expense',
    nextExecutionAt: '2026-07-31',
    interval: 'monthly',
    paused: false,
    categoryId: '',
    paymentMethodId: '',
    receiver: '',
    information: '',
  }),
  saveRecurringPayment: mocks.save,
  setRecurringPaymentPaused: mocks.pause,
  executeRecurringPayment: mocks.execute,
  deleteRecurringPayment: mocks.remove,
}));
const payment = {
  id: 'r1',
  receiver: 'Rent',
  transferAmount: -900,
  nextExecutionAt: new Date(2026, 6, 31),
  interval: 'monthly',
  paused: true,
  category: {id: 'c1', name: 'Housing'},
  paymentMethod: {id: 'p1', name: 'Bank'},
} as unknown as TExpandedRecurringPayment;
const props = {
  initialPayments: [payment],
  totalCount: 1,
  categories: [payment.category],
  paymentMethods: [payment.paymentMethod],
  search: '',
  statusFilter: 'all' as const,
  page: 1,
  pageSize: 25,
};

describe('RecurringPaymentWorkspace', () => {
  beforeEach(() => vi.clearAllMocks());

  it('makes paused state explicit and excludes urgent execution', () => {
    render(<RecurringPaymentWorkspace {...props} />);
    expect(screen.getAllByText('Paused').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', {name: 'Execute Rent'}).every(button => button.hasAttribute('disabled'))).toBe(
      true,
    );
  });

  it('persists filters in the URL and resumes a payment', async () => {
    mocks.pause.mockResolvedValue(true);
    render(<RecurringPaymentWorkspace {...props} />);
    fireEvent.change(screen.getByLabelText('Search recurring payments'), {target: {value: 'rent'}});
    fireEvent.change(screen.getByLabelText('Recurring status filter'), {target: {value: 'paused'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Apply filters'}).closest('form')!);
    expect(mocks.push).toHaveBeenCalledWith('/recurring-payments?search=rent&status=paused');
    fireEvent.click(screen.getAllByRole('button', {name: 'Resume Rent'})[0]!);
    await waitFor(() => expect(mocks.pause).toHaveBeenCalledWith(payment, false));
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('requires confirmation before deletion', async () => {
    mocks.remove.mockResolvedValue(true);
    render(<RecurringPaymentWorkspace {...props} />);
    fireEvent.click(screen.getAllByRole('button', {name: 'Delete Rent'})[0]!);
    fireEvent.click(await screen.findByRole('button', {name: 'Delete recurring payment'}));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('r1'));
  });
});
