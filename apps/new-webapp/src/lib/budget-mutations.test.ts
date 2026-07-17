import {beforeEach, describe, expect, it, vi} from 'vitest';
import {budgetToDraft, deleteBudget, saveBudget} from './budget-mutations';

const mocks = vi.hoisted(() => ({create: vi.fn(), update: vi.fn(), remove: vi.fn()}));
vi.mock('@/apiClient', () => ({
  apiClient: {backend: {budget: {create: mocks.create, updateById: mocks.update, deleteById: mocks.remove}}},
}));
const draft = {
  name: 'Food',
  type: 'e' as const,
  amount: '300.00',
  period: '2026-07',
  warningThreshold: '80',
  categoryIds: ['cat'],
  description: '',
};

describe('budget mutations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates explicit monthly defaults and validates categories', async () => {
    expect(budgetToDraft()).toMatchObject({type: 'e', warningThreshold: '80'});
    await expect(saveBudget({...draft, categoryIds: []})).resolves.toEqual({
      success: false,
      error: 'Select at least one category.',
    });
  });

  it('saves exact amount, period, and warning threshold', async () => {
    mocks.create.mockResolvedValue([{data: {}}, null]);
    await expect(saveBudget(draft)).resolves.toEqual({success: true});
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({budget: 300, period: '2026-07', warningThreshold: 80}),
    );
  });

  it('reports deletion outcome', async () => {
    mocks.remove.mockResolvedValue([{data: null}, null]);
    await expect(deleteBudget('budget')).resolves.toBe(true);
  });
});
