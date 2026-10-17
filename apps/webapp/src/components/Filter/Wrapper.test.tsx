import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {FilterWrapper} from './Wrapper';

const {getCategories, getPaymentMethods, logError} = vi.hoisted(() => ({
  getCategories: vi.fn(),
  getPaymentMethods: vi.fn(),
  logError: vi.fn(),
}));
vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      category: {getValueHelp: getCategories},
      paymentMethod: {getValueHelp: getPaymentMethods},
    },
  },
}));
vi.mock('@/logger', () => ({logger: {error: logError, debug: vi.fn(), info: vi.fn(), warn: vi.fn()}}));

const category: TCategoryVH = {id: 'cat-1' as TCategoryVH['id'], name: 'Food', description: null};
const paymentMethod: TPaymentMethodVH = {
  id: 'pm-1' as TPaymentMethodVH['id'],
  name: 'Card',
  description: null,
  provider: '',
  address: '',
};
const currentFilters = {categories: [category.id], paymentMethods: [paymentMethod.id]};

beforeEach(() => {
  vi.clearAllMocks();
  getCategories.mockResolvedValue([[category], null]);
  getPaymentMethods.mockResolvedValue([[paymentMethod], null]);
});
afterEach(() => cleanup());

describe('FilterWrapper selected IDs', () => {
  it.each(['category', 'paymentMethod'] as const)(
    'preserves selections when %s fails and the other list is empty',
    async failed => {
      const failing = failed === 'category' ? getCategories : getPaymentMethods;
      const empty = failed === 'category' ? getPaymentMethods : getCategories;
      failing.mockResolvedValue([null, new Error('Options unavailable')]);
      empty.mockResolvedValue([[], null]);
      const onApply = vi.fn();
      render(<FilterWrapper currentFilters={currentFilters} onApply={onApply} withCategories withPaymentMethods />);
      await waitFor(() => expect(logError).toHaveBeenCalled());
      fireEvent.click(screen.getByRole('button', {name: 'Filters active'}));
      fireEvent.click(await screen.findByRole('button', {name: 'Apply'}));
      expect(onApply).toHaveBeenCalledWith(currentFilters);
    },
  );

  it('preserves selected IDs when applying before option requests finish', async () => {
    let resolveCategories!: (value: [TCategoryVH[], null]) => void;
    let resolvePayments!: (value: [TPaymentMethodVH[], null]) => void;
    getCategories.mockImplementation(() => new Promise(resolve => (resolveCategories = resolve)));
    getPaymentMethods.mockImplementation(() => new Promise(resolve => (resolvePayments = resolve)));
    const onApply = vi.fn();
    render(<FilterWrapper currentFilters={currentFilters} onApply={onApply} withCategories withPaymentMethods />);
    fireEvent.click(screen.getByRole('button', {name: 'Filters active'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Apply'}));
    expect(onApply).toHaveBeenCalledWith(currentFilters);
    await act(async () => {
      resolveCategories([[category], null]);
      resolvePayments([[paymentMethod], null]);
    });
  });

  it('handles rejected option requests and still allows an explicit reset', async () => {
    getCategories.mockRejectedValue(new Error('Options unavailable'));
    const onApply = vi.fn();
    render(<FilterWrapper currentFilters={currentFilters} onApply={onApply} withCategories withPaymentMethods />);
    await waitFor(() => expect(logError).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', {name: 'Filters active'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Reset'}));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({categories: [], paymentMethods: []}));
  });
});
