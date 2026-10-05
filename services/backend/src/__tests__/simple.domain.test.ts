import * as tables from '@budgetbuddyde/db/backend';
import * as operators from 'drizzle-orm';
import {PgDialect} from 'drizzle-orm/pg-core';
import * as budgetDomain from '../domain/budget';
import * as categoryDomain from '../domain/category';
import * as paymentMethodDomain from '../domain/paymentMethod';

const mocks = vi.hoisted(() => {
  const query = Object.fromEntries(
    ['categories', 'paymentMethods', 'budgets'].map(name => [name, {findMany: vi.fn(), findFirst: vi.fn()}]),
  );
  const chain = {
    then: vi.fn(),
    values: vi.fn(),
    set: vi.fn(),
    where: vi.fn(),
    from: vi.fn(),
    returning: vi.fn(),
    limit: vi.fn(),
    groupBy: vi.fn(),
  };
  return {
    db: {query, insert: vi.fn(), update: vi.fn(), delete: vi.fn(), select: vi.fn(), transaction: vi.fn()},
    chain,
    invalidate: vi.fn(),
  };
});
vi.mock('../db', () => ({db: mocks.db}));
vi.mock('../domain/cache', () => ({invalidateDomainMutation: mocks.invalidate}));
vi.mock('../config', () => ({config: {pagination: {maxPageSize: 100}}}));
vi.mock('../lib/logger', () => ({logger: {error: vi.fn()}}));

const ID = '00000000-0000-4000-8000-000000000001';
const CATEGORY = '00000000-0000-4000-8000-000000000002';
const OWNER = 'owner';
const entities = [
  {
    domain: categoryDomain,
    table: tables.categories,
    relation: 'categories',
    route: '/api/category',
    body: {name: 'Rent', description: null},
  },
  {
    domain: paymentMethodDomain,
    table: tables.paymentMethods,
    relation: 'paymentMethods',
    route: '/api/paymentMethod',
    body: {name: 'Card', provider: 'Bank', address: 'DE123', description: null},
  },
  {
    domain: budgetDomain,
    table: tables.budgets,
    relation: 'budgets',
    route: '/api/budget',
    body: {name: 'Rent', budget: 100, description: null, type: 'i' as const, categories: []},
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  for (const method of ['values', 'set', 'where', 'from'] as const) mocks.chain[method].mockReturnValue(mocks.chain);
  mocks.chain.then.mockImplementation((resolve: (value: unknown[]) => unknown) => Promise.resolve([]).then(resolve));
  mocks.chain.returning.mockResolvedValue([{id: ID, ownerId: OWNER, categories: [], type: 'i'}]);
  mocks.chain.limit.mockResolvedValue([{count: 1}]);
  mocks.chain.groupBy.mockResolvedValue([]);
  for (const method of ['insert', 'update', 'delete', 'select'] as const) mocks.db[method].mockReturnValue(mocks.chain);
  mocks.db.transaction.mockImplementation(async callback => callback(mocks.db));
  for (const relation of Object.values(mocks.db.query)) {
    relation.findMany.mockResolvedValue([]);
    relation.findFirst.mockResolvedValue({id: ID, ownerId: OWNER, categories: [], type: 'i'});
  }
});

for (const entity of entities) {
  describe(`${entity.relation} shared domain operations`, () => {
    it('rejects invalid requests before persistence and invalidation', async () => {
      expect((await entity.domain.list(OWNER, {from: -1})).status).toBe(400);
      expect((await entity.domain.list(OWNER, {from: 4, to: 2})).status).toBe(400);
      expect((await entity.domain.list(OWNER, {from: 0, to: 101})).status).toBe(400);
      expect((await entity.domain.get(OWNER, 'invalid')).status).toBe(400);
      expect((await entity.domain.create(OWNER, {} as never)).status).toBe(400);
      expect((await entity.domain.update(OWNER, 'invalid', entity.body as never)).status).toBe(400);
      expect((await entity.domain.remove(OWNER, 'invalid')).status).toBe(400);
      expect(mocks.db.insert).not.toHaveBeenCalled();
      expect(mocks.db.query[entity.relation].findFirst).not.toHaveBeenCalled();
      expect(mocks.invalidate).not.toHaveBeenCalled();
    });

    it('keeps concurrent owner reads isolated and retains wire metadata', async () => {
      const results = await Promise.all([entity.domain.get(OWNER, ID), entity.domain.get('other-owner', ID)]);
      expect(results[0]).toMatchObject({status: 200, from: 'db', data: {id: ID}});
      expect(results[0]).not.toHaveProperty('error');
      const predicates = mocks.db.query[entity.relation].findFirst.mock.calls.map(([options]) =>
        new PgDialect().sqlToQuery(options.where(entity.table, operators)),
      );
      expect(predicates[0].params).toContain(OWNER);
      expect(predicates[1].params).toContain('other-owner');
      expect(predicates.every(predicate => predicate.params.includes(ID))).toBe(true);
    });

    it('returns 404 for a record outside the owner query without invalidation', async () => {
      mocks.db.query[entity.relation].findFirst.mockResolvedValue(undefined);
      expect((await entity.domain.get(OWNER, ID)).status).toBe(404);
      mocks.chain.returning.mockResolvedValue([]);
      expect((await entity.domain.remove(OWNER, ID)).status).toBe(404);
      expect(mocks.invalidate).not.toHaveBeenCalled();
    });

    it('forces authenticated ownership on creation and invalidates only after success', async () => {
      const result = await entity.domain.create(OWNER, {...entity.body, ownerId: 'foreign-owner'} as never);
      expect(result.status).toBe(200);
      const values = mocks.chain.values.mock.calls[0][0];
      expect(Array.isArray(values) ? values[0] : values).toMatchObject({ownerId: OWNER});
      expect(mocks.invalidate).toHaveBeenCalledExactlyOnceWith(OWNER, entity.route);
      expect(mocks.invalidate.mock.invocationCallOrder[0]).toBeGreaterThan(
        mocks.chain.returning.mock.invocationCallOrder[0],
      );
    });

    it('prevents ownership reassignment through update input', async () => {
      const result = await entity.domain.update(OWNER, ID, {...entity.body, ownerId: 'foreign-owner'} as never);
      expect(result.status).toBe(200);
      expect(mocks.chain.set).toHaveBeenCalledWith(expect.objectContaining({ownerId: OWNER}));
      const predicate = new PgDialect().sqlToQuery(mocks.chain.where.mock.calls[0][0]);
      expect(predicate.params).toContain(OWNER);
      expect(predicate.params).toContain(ID);
      expect(predicate.params).not.toContain('foreign-owner');
    });

    it('invalidates successful updates and deletes once each', async () => {
      expect((await entity.domain.update(OWNER, ID, entity.body as never)).status).toBe(200);
      expect((await entity.domain.remove(OWNER, ID)).status).toBe(200);
      expect(mocks.invalidate).toHaveBeenCalledTimes(2);
    });

    it('preserves database error responses without successful-mutation invalidation', async () => {
      mocks.chain.returning.mockRejectedValue(new Error('private database details'));
      const result = await entity.domain.create(OWNER, entity.body as never);
      expect(result).toMatchObject({status: 500, message: 'Internal Server Error', data: null});
      expect(JSON.stringify(result)).not.toContain('private database details');
      expect(mocks.invalidate).not.toHaveBeenCalled();
    });
  });
}

it('rejects foreign budget categories before opening a transaction', async () => {
  const result = await budgetDomain.create(OWNER, {
    name: 'Rent',
    budget: 100,
    description: null,
    type: 'i',
    categories: [CATEGORY],
  });
  expect(result).toMatchObject({status: 400, message: 'One or more referenced categories are invalid'});
  expect(mocks.db.transaction).not.toHaveBeenCalled();
  expect(mocks.invalidate).not.toHaveBeenCalled();
});
