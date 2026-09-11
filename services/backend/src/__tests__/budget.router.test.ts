import {PgDialect} from 'drizzle-orm/pg-core';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {requestRouter} from './router.test-utils';
import {budgetRouter} from '../router/budget.router';

const {budgetFindFirst, categoryFindMany, select, transaction} = vi.hoisted(() => ({
  budgetFindFirst: vi.fn(),
  categoryFindMany: vi.fn(),
  transaction: vi.fn(),
  select: vi.fn(),
}));

vi.mock('../config', () => ({
  config: {timezone: 'Europe/Berlin'},
}));

vi.mock('../db', () => ({
  db: {
    query: {
      categories: {findMany: categoryFindMany},
      budgets: {findMany: vi.fn(), findFirst: budgetFindFirst},
      recurringPayments: {findMany: vi.fn()},
    },
    transaction,
    select,
  },
}));

const USER_ID = 'user-1';
const OWNED_CATEGORY_ID = '00000000-0000-4000-8000-000000000001';
const FOREIGN_CATEGORY_ID = '00000000-0000-4000-8000-000000000002';
const BUDGET_ID = '00000000-0000-4000-8000-000000000003';

const budgetRecord = {
  id: BUDGET_ID,
  ownerId: USER_ID,
  type: 'e' as const,
  name: 'Monthly budget',
  budget: 100,
  description: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  categories: [{categoryId: OWNED_CATEGORY_ID, category: {id: OWNED_CATEGORY_ID}}],
};

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

describe('budget lookup by id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{total: 42}]),
    });
  });

  it('returns 404 when the budget does not exist', async () => {
    const response = await requestRouter(budgetRouter, USER_ID, `/${BUDGET_ID}`, {method: 'GET'});

    expect(response.status).toBe(404);
    expect(select).not.toHaveBeenCalled();
  });

  it('returns one budget and calculates its balance for the authenticated owner', async () => {
    budgetFindFirst.mockResolvedValueOnce(budgetRecord);

    const response = await requestRouter(budgetRouter, USER_ID, `/${BUDGET_ID}`, {method: 'GET'});

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({data: {id: BUDGET_ID, balance: 42}});
    expect(response.body).not.toMatchObject({data: [expect.anything()]});
    expect(select).toHaveBeenCalledOnce();
    expect(select.mock.results[0].value.where).toHaveBeenCalledOnce();
    const balanceCondition = select.mock.results[0].value.where.mock.calls[0][0];
    const query = new PgDialect().sqlToQuery(balanceCondition.getSQL());
    expect(query.params).toContain(USER_ID);
    expect(query.sql).toContain('owner_id');
  });
});
