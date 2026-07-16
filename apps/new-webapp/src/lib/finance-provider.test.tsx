import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {FinanceProvider, useFinance} from './finance-provider';

const apiMocks = vi.hoisted(() => ({
  categoryGetAll: vi.fn(),
  methodGetAll: vi.fn(),
  transactionGetAll: vi.fn(),
  recurringGetAll: vi.fn(),
  budgetGetAll: vi.fn(),
  categoryCreate: vi.fn(),
}));

vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      category: {
        getAll: apiMocks.categoryGetAll,
        create: apiMocks.categoryCreate,
        updateById: vi.fn(),
        deleteById: vi.fn(),
        merge: vi.fn(),
      },
      paymentMethod: {
        getAll: apiMocks.methodGetAll,
        create: vi.fn(),
        updateById: vi.fn(),
        deleteById: vi.fn(),
        merge: vi.fn(),
      },
      transaction: {getAll: apiMocks.transactionGetAll, create: vi.fn(), updateById: vi.fn(), deleteById: vi.fn()},
      recurringPayment: {
        getAll: apiMocks.recurringGetAll,
        create: vi.fn(),
        updateById: vi.fn(),
        deleteById: vi.fn(),
        executePayment: vi.fn(),
      },
      budget: {getAll: apiMocks.budgetGetAll, create: vi.fn(), updateById: vi.fn(), deleteById: vi.fn()},
    },
  },
}));

function Consumer() {
  const finance = useFinance();
  return (
    <div>
      <span>{finance.status}</span>
      <span>{finance.data.categories.map(item => item.name).join(',')}</span>
      <span>{finance.cacheKeys.categories}</span>
      <button onClick={() => void finance.createEntity('categories', {name: 'Travel'})}>Create</button>
    </div>
  );
}

describe('FinanceProvider', () => {
  beforeEach(() => {
    apiMocks.categoryGetAll.mockResolvedValue([{data: [{id: 'cat-1', name: 'Food', description: null}]}, null]);
    apiMocks.methodGetAll.mockResolvedValue([{data: []}, null]);
    apiMocks.transactionGetAll.mockResolvedValue([{data: []}, null]);
    apiMocks.recurringGetAll.mockResolvedValue([{data: []}, null]);
    apiMocks.budgetGetAll.mockResolvedValue([{data: []}, null]);
    apiMocks.categoryCreate.mockResolvedValue([{data: []}, null]);
  });

  it('loads private finance data and publishes user-scoped cache keys', async () => {
    render(
      <FinanceProvider userId="user-1">
        <Consumer />
      </FinanceProvider>,
    );
    expect(await screen.findByText('Food')).toBeVisible();
    expect(screen.getByText('success')).toBeVisible();
    expect(screen.getByText('finance:user-1:categories:')).toBeVisible();
  });

  it('invalidates and reloads after a successful mutation', async () => {
    render(
      <FinanceProvider userId="user-1">
        <Consumer />
      </FinanceProvider>,
    );
    await screen.findByText('Food');
    await userEvent.click(screen.getByRole('button', {name: 'Create'}));
    await waitFor(() => expect(apiMocks.categoryCreate).toHaveBeenCalledWith({name: 'Travel'}));
    await waitFor(() => expect(apiMocks.categoryGetAll).toHaveBeenCalledTimes(2));
  });

  it('rejects context use outside its provider boundary', () => {
    expect(() => render(<Consumer />)).toThrow('useFinance must be used inside FinanceProvider.');
  });
});
