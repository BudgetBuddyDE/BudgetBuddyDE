import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {PaymentMethodWorkspace} from './payment-method-workspace';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  inspect: vi.fn(),
  remove: vi.fn(),
  merge: vi.fn(),
  save: vi.fn(),
}));
vi.mock('next/navigation', () => ({useRouter: () => ({push: mocks.push, refresh: mocks.refresh})}));
vi.mock('@/lib/payment-method-mutations', () => ({
  paymentMethodToDraft: () => ({name: '', type: 'other', status: 'active', provider: '', address: '', description: ''}),
  savePaymentMethod: mocks.save,
  inspectPaymentMethodImpact: mocks.inspect,
  deletePaymentMethod: mocks.remove,
  mergePaymentMethods: mocks.merge,
}));
const methods = [
  {id: 'pay-1', name: 'Visa', type: 'card', status: 'active', provider: 'Bank', address: '1234', description: null},
  {
    id: 'pay-2',
    name: 'Old cash',
    type: 'cash',
    status: 'inactive',
    provider: 'Wallet',
    address: 'Cash',
    description: null,
  },
] as TPaymentMethod[];
const props = {initialPaymentMethods: methods, totalCount: 2, search: '', page: 1, pageSize: 25};

describe('PaymentMethodWorkspace', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows recognizable inactive status and URL search', () => {
    render(<PaymentMethodWorkspace {...props} />);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Search payment methods'), {target: {value: 'visa'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Search'}).closest('form')!);
    expect(mocks.push).toHaveBeenCalledWith('/payment-methods?search=visa');
  });

  it('protects historical assignments from direct deletion', async () => {
    mocks.inspect.mockResolvedValue({transactions: 1, recurringPayments: 2});
    render(<PaymentMethodWorkspace {...props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Delete Visa'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('1 transaction(s) and 2 recurring payment(s)');
  });

  it('merges selected methods into an explicit target', async () => {
    mocks.merge.mockResolvedValue(true);
    render(<PaymentMethodWorkspace {...props} />);
    fireEvent.click(screen.getByLabelText('Select row pay-1'));
    fireEvent.click(screen.getByRole('button', {name: 'Merge selected (1)'}));
    fireEvent.change(await screen.findByLabelText('Target payment method'), {target: {value: 'pay-2'}});
    fireEvent.click(screen.getByRole('button', {name: 'Merge payment methods'}));
    await waitFor(() => expect(mocks.merge).toHaveBeenCalledWith(['pay-1'], 'pay-2'));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
