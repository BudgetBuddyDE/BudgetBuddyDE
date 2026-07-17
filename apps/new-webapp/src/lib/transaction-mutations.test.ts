import {beforeEach, describe, expect, it, vi} from 'vitest';
import {deleteTransaction, saveTransactions} from './transaction-mutations';

const mocks = vi.hoisted(() => ({
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  createCategory: vi.fn(),
}));
vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      transaction: {
        create: mocks.createTransaction,
        updateById: mocks.updateTransaction,
        deleteById: mocks.deleteTransaction,
      },
      category: {create: mocks.createCategory},
    },
  },
}));

const validDraft = {
  amount: '10.00',
  type: 'expense' as const,
  date: '2026-07-16',
  categoryId: 'category-1',
  paymentMethodId: 'payment-1',
  receiver: 'Market',
  information: '',
};

describe('transaction mutations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates every draft before issuing any mutation', async () => {
    const result = await saveTransactions([{...validDraft, amount: 'bad'}, validDraft], []);
    expect(result).toMatchObject({saved: 0, failed: 2});
    expect(result.validationErrors[0]?.amount).toBeDefined();
    expect(mocks.createTransaction).not.toHaveBeenCalled();
  });

  it('creates uncategorized once and saves a batch through real entity endpoints', async () => {
    mocks.createCategory.mockResolvedValue([{data: [{id: 'uncategorized'}]}, null]);
    mocks.createTransaction.mockResolvedValue([[{}], null]);
    const result = await saveTransactions(
      [
        {...validDraft, categoryId: ''},
        {...validDraft, receiver: 'Shop', categoryId: ''},
      ],
      [],
    );
    expect(result).toEqual({saved: 2, failed: 0, validationErrors: {}});
    expect(mocks.createCategory).toHaveBeenCalledOnce();
    expect(mocks.createTransaction).toHaveBeenCalledTimes(2);
    expect(mocks.createTransaction.mock.calls[0]?.[0]).toMatchObject({
      categoryId: 'uncategorized',
      transferAmount: -10,
    });
  });

  it('updates existing drafts and reports partial service failures', async () => {
    mocks.updateTransaction.mockResolvedValueOnce([[{}], null]).mockResolvedValueOnce([null, new Error('failed')]);
    const result = await saveTransactions(
      [
        {...validDraft, id: 'one'},
        {...validDraft, id: 'two'},
      ],
      [],
    );
    expect(result).toMatchObject({saved: 1, failed: 1});
  });

  it('reports deletion outcomes', async () => {
    mocks.deleteTransaction.mockResolvedValueOnce([[{}], null]).mockResolvedValueOnce([null, new Error('failed')]);
    await expect(deleteTransaction('one')).resolves.toBe(true);
    await expect(deleteTransaction('two')).resolves.toBe(false);
  });
});
