import type {TCategory} from '@budgetbuddyde/api/category';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  categoryToDraft,
  deleteCategory,
  inspectCategoryImpact,
  mergeCategories,
  saveCategory,
} from './category-mutations';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  merge: vi.fn(),
  transactions: vi.fn(),
  recurring: vi.fn(),
}));
vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      category: {create: mocks.create, updateById: mocks.update, deleteById: mocks.remove, merge: mocks.merge},
      transaction: {getAll: mocks.transactions},
      recurringPayment: {getAll: mocks.recurring},
    },
  },
}));

const id = '00000000-0000-4000-8000-000000000001' as TCategory['id'];

describe('category mutations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps category metadata into an editable draft', () => {
    expect(
      categoryToDraft({
        name: 'Food',
        type: 'expense',
        color: '#112233',
        icon: 'utensils',
        budgetTarget: 250,
        description: null,
      } as TCategory),
    ).toMatchObject({name: 'Food', budgetTarget: '250.00'});
  });

  it('validates required metadata before saving', async () => {
    await expect(saveCategory({...categoryToDraft(), name: ''})).resolves.toEqual({
      success: false,
      error: 'Enter a category name.',
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('saves normalized category values through the API', async () => {
    mocks.create.mockResolvedValue([{data: []}, null]);
    await expect(saveCategory({...categoryToDraft(), name: ' Food ', budgetTarget: '25.50'})).resolves.toEqual({
      success: true,
    });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({name: 'Food', budgetTarget: 25.5}));
  });

  it('blocks deletion while related finance data exists', async () => {
    mocks.transactions.mockResolvedValue([{totalCount: 2}, null]);
    mocks.recurring.mockResolvedValue([{totalCount: 1}, null]);
    await expect(inspectCategoryImpact(id)).resolves.toEqual({transactions: 2, recurringPayments: 1});
    await expect(deleteCategory(id)).resolves.toBe(false);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('deletes unused categories and merges selected sources', async () => {
    mocks.transactions.mockResolvedValue([{totalCount: 0}, null]);
    mocks.recurring.mockResolvedValue([{totalCount: 0}, null]);
    mocks.remove.mockResolvedValue([{data: null}, null]);
    mocks.merge.mockResolvedValue([{data: {}}, null]);
    await expect(deleteCategory(id)).resolves.toBe(true);
    await expect(mergeCategories([id], id)).resolves.toBe(true);
  });
});
