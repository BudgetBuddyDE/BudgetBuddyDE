import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RecurringPaymentDialog} from './recurring-payment-dialog';

const mocks = vi.hoisted(() => ({save: vi.fn()}));
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
}));

describe('RecurringPaymentDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('captures interval, date, and pause state', async () => {
    mocks.save.mockResolvedValue({success: true});
    const onSaved = vi.fn();
    render(
      <RecurringPaymentDialog
        open
        onOpenChange={() => undefined}
        categories={[]}
        paymentMethods={[]}
        onSaved={onSaved}
      />,
    );
    fireEvent.change(screen.getByLabelText('Recurring interval'), {target: {value: 'yearly'}});
    fireEvent.click(screen.getByLabelText('Pause this payment'));
    fireEvent.click(screen.getByRole('button', {name: 'Save recurring payment'}));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({interval: 'yearly', paused: true}), undefined),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it('keeps validation errors visible', async () => {
    mocks.save.mockResolvedValue({success: false, error: 'Enter a valid amount greater than zero.'});
    render(
      <RecurringPaymentDialog
        open
        onOpenChange={() => undefined}
        categories={[]}
        paymentMethods={[]}
        onSaved={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Save recurring payment'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('valid amount');
  });
});
