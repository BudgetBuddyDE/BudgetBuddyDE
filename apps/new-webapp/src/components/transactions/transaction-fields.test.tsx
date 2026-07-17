import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {createTransactionDraft} from '@/lib/transaction-form';
import {TransactionFields} from './transaction-fields';

const categories = [{id: 'cat-1', name: 'Food', description: null}] as unknown as TCategoryVH[];
const paymentMethods = [
  {id: 'pay-1', name: 'Card', provider: 'Bank', address: '1234', description: null},
] as unknown as TPaymentMethodVH[];

describe('TransactionFields', () => {
  it('renders all domain fields and emits immutable changes', () => {
    const onChange = vi.fn();
    render(
      <TransactionFields
        idPrefix="tx"
        value={createTransactionDraft()}
        onChange={onChange}
        categories={categories}
        paymentMethods={paymentMethods}
      />,
    );
    expect(screen.getByRole('option', {name: 'Uncategorized'})).toBeInTheDocument();
    expect(screen.getByRole('option', {name: 'Food'})).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Amount'), {target: {value: '12.34'}});
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({amount: '12.34'}));
  });

  it('associates validation messages with the relevant workflow', () => {
    render(
      <TransactionFields
        idPrefix="tx"
        value={createTransactionDraft()}
        onChange={() => undefined}
        categories={categories}
        paymentMethods={paymentMethods}
        errors={{amount: 'Invalid amount', paymentMethodId: 'Required'}}
      />,
    );
    expect(screen.getAllByRole('alert').map(alert => alert.textContent)).toEqual(['Invalid amount', 'Required']);
  });
});
