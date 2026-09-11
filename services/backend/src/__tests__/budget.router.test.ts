import {beforeEach, describe, expect, it, vi} from 'vitest';
import {requestRouter} from './router.test-utils';
import {budgetRouter} from '../router/budget.router';

const {categoryFindMany, transaction} = vi.hoisted(() => ({
  categoryFindMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../config', () => ({
  config: {timezone: 'Europe/Berlin'},
}));

vi.mock('../db', () => ({
  db: {
    query: {
      categories: {findMany: categoryFindMany},
      budgets: {findMany: vi.fn(), findFirst: vi.fn()},
      recurringPayments: {findMany: vi.fn()},
    },
    transaction,
  },
}));

const USER_ID = 'user-1';
const OWNED_CATEGORY_ID = '00000000-0000-4000-8000-000000000001';
const FOREIGN_CATEGORY_ID = '00000000-0000-4000-8000-000000000002';
const BUDGET_ID = '00000000-0000-4000-8000-000000000003';

const budgetBody = {
  type: 'e',
  name: 'Monthly budget',
  budget: 100,
  description: null,
  categories: [OWNED_CATEGORY_ID, FOREIGN_CATEGORY_ID],
};

describe('single budget writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryFindMany.mockResolvedValue([{id: OWNED_CATEGORY_ID}]);
  });

  it('rejects create when one category is not owned by the user', async () => {
    const response = await requestRouter(budgetRouter, USER_ID, '/', {method: 'POST', body: budgetBody});

    expect(response.status).toBe(400);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects update before changing links when one replacement category is not owned by the user', async () => {
    const response = await requestRouter(budgetRouter, USER_ID, `/${BUDGET_ID}`, {
      method: 'PUT',
      body: budgetBody,
    });

    expect(response.status).toBe(400);
    expect(transaction).not.toHaveBeenCalled();
  });
});
