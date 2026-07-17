import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {PaymentMethodDialog} from './payment-method-dialog';

const mocks = vi.hoisted(() => ({save: vi.fn()}));
vi.mock('@/lib/payment-method-mutations', () => ({
  paymentMethodToDraft: () => ({name: '', type: 'other', status: 'active', provider: '', address: '', description: ''}),
  savePaymentMethod: mocks.save,
}));

describe('PaymentMethodDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits type, status, provider, and account reference', async () => {
    mocks.save.mockResolvedValue({success: true});
    const onSaved = vi.fn();
    render(<PaymentMethodDialog open onOpenChange={() => undefined} onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText('Payment method name'), {target: {value: 'Visa'}});
    fireEvent.change(screen.getByLabelText('Payment method type'), {target: {value: 'card'}});
    fireEvent.change(screen.getByLabelText('Payment method status'), {target: {value: 'inactive'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save payment method'}));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(
        expect.objectContaining({name: 'Visa', type: 'card', status: 'inactive'}),
        undefined,
      ),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows save failures in the dialog', async () => {
    mocks.save.mockResolvedValue({success: false, error: 'Enter a provider.'});
    render(<PaymentMethodDialog open onOpenChange={() => undefined} onSaved={() => undefined} />);
    fireEvent.click(screen.getByRole('button', {name: 'Save payment method'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a provider');
  });
});
