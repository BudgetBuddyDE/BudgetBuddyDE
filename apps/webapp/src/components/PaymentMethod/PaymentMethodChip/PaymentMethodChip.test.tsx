import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {PaymentMethodChip} from './PaymentMethodChip';

describe('PaymentMethodChip', () => {
  it('renders the payment method name as the chip label', () => {
    render(<PaymentMethodChip paymentMethodName="Credit Card" />);
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
  });

  it('renders with outlined variant by default', () => {
    render(<PaymentMethodChip paymentMethodName="PayPal" data-testid="chip" />);
    expect(screen.getByTestId('chip')).toBeInTheDocument();
  });

  it('forwards additional chip props', () => {
    render(<PaymentMethodChip paymentMethodName="Cash" data-testid="cash-chip" />);
    expect(screen.getByTestId('cash-chip')).toBeInTheDocument();
  });

  it('renders with different payment method names', () => {
    const {rerender} = render(<PaymentMethodChip paymentMethodName="SEPA" />);
    expect(screen.getByText('SEPA')).toBeInTheDocument();

    rerender(<PaymentMethodChip paymentMethodName="Apple Pay" />);
    expect(screen.getByText('Apple Pay')).toBeInTheDocument();
  });
});
