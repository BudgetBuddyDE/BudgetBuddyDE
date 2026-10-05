import * as tables from '@budgetbuddyde/db/backend';
import * as operators from 'drizzle-orm';
import {PgDialect} from 'drizzle-orm/pg-core';
import {requestRouter} from './router.test-utils';
import {budgetRouter} from '../router/budget.router';
import {categoryRouter} from '../router/category.router';
import {paymentMethodRouter} from '../router/paymentMethod.router';
import {recurringPaymentRouter} from '../router/recurringPayment.router';
import {transactionRouter} from '../router/transaction.router';

const mocks = vi.hoisted(() => {
  const query = Object.fromEntries(
    ['categories', 'paymentMethods', 'transactions', 'recurringPayments', 'budgets'].map(name => [
      name,
      {findMany: vi.fn(), findFirst: vi.fn()},
    ]),
  );
  const chain = {
    then: vi.fn(),
    values: vi.fn(),
    set: vi.fn(),
    where: vi.fn(),
    returning: vi.fn(),
    from: vi.fn(),
    limit: vi.fn(),
    groupBy: vi.fn(),
    orderBy: vi.fn(),
    leftJoin: vi.fn(),
  };
  const db = {query, insert: vi.fn(), update: vi.fn(), delete: vi.fn(), select: vi.fn(), transaction: vi.fn()};
  return {
    chain,
    db,
    log: {info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis()},
    attachments: {
      findAttachmentsByTransactionId: vi.fn(),
      generateSignedUrls: vi.fn(),
      deleteAttachmentsByTransactionId: vi.fn(),
    },
  };
});
vi.mock('../db', () => ({db: mocks.db}));
vi.mock('../lib', () => ({logger: mocks.log}));
vi.mock('../lib/cache/attachment.cache', () => ({AttachmentCache: vi.fn()}));
vi.mock('../lib/attachment', () => ({
  TransactionAttachmentHandler: Object.assign(
    vi.fn(() => mocks.attachments),
    {resolveMimeType: vi.fn(), hasValidImageSignature: vi.fn()},
  ),
}));
vi.mock('../config', () => ({
  config: {
    timezone: 'UTC',
    pagination: {maxPageSize: 100},
    attachments: {upload: {maxFilesPerRequest: 10, maxFileSizeBytes: 10000}, transactionPreviewLimit: 3},
    getRequiredObjectStorageConfig: () => ({bucketName: 'mock'}),
  },
}));
vi.mock('../middleware/cache.middleware', () => ({invalidateUserCaches: vi.fn()}));
vi.mock('../utils/createTransactionFromRecurringPayment', () => ({createTransactionFromRecurringPayment: vi.fn()}));

const ID = '00000000-0000-4000-8000-000000000001';
const CATEGORY = '00000000-0000-4000-8000-000000000002';
const PAYMENT = '00000000-0000-4000-8000-000000000003';
const OWNER = 'owner';
const categoryBody = {name: 'Rent', description: null};
const paymentBody = {name: 'Card', provider: 'Bank', address: 'DE123', description: null};
const transactionBody = {
  categoryId: CATEGORY,
  paymentMethodId: PAYMENT,
  processedAt: '2026-01-10T12:00:00.000Z',
  receiver: 'Shop',
  transferAmount: -20,
  information: null,
};
const recurringBody = {
  categoryId: CATEGORY,
  paymentMethodId: PAYMENT,
  startsOn: '2026-01-01',
  receiver: 'Rent',
  transferAmount: -20,
  information: null,
  executionPlan: 'monthly',
  paused: false,
};
const budgetBody = {name: 'Rent', budget: 100, description: null, type: 'i', categories: []};
const entities = [
  {name: 'categories', router: categoryRouter, table: tables.categories, body: categoryBody, batch: true},
  {name: 'paymentMethods', router: paymentMethodRouter, table: tables.paymentMethods, body: paymentBody, batch: true},
  {name: 'transactions', router: transactionRouter, table: tables.transactions, body: transactionBody, batch: true},
  {
    name: 'recurringPayments',
    router: recurringPaymentRouter,
    table: tables.recurringPayments,
    body: recurringBody,
    batch: true,
  },
  {name: 'budgets', router: budgetRouter, table: tables.budgets, body: budgetBody, batch: false},
];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.log.child.mockReturnValue(mocks.log);
  for (const method of ['values', 'set', 'where', 'from', 'leftJoin'] as const)
    mocks.chain[method].mockReturnValue(mocks.chain);
  mocks.chain.then.mockImplementation((resolve: (value: unknown[]) => unknown) => Promise.resolve([]).then(resolve));
  mocks.chain.returning.mockResolvedValue([
    {id: ID, ownerId: OWNER, name: 'Record', categories: [], type: 'i', budget: 100},
  ]);
  mocks.chain.limit.mockResolvedValue([{count: 1}]);
  mocks.chain.groupBy.mockResolvedValue([]);
  mocks.chain.orderBy.mockResolvedValue([]);
  for (const method of ['insert', 'update', 'delete', 'select'] as const) mocks.db[method].mockReturnValue(mocks.chain);
  mocks.db.transaction.mockImplementation(async callback => callback(mocks.db));
  for (const relation of Object.values(mocks.db.query)) {
    relation.findMany.mockResolvedValue([]);
    relation.findFirst.mockResolvedValue({id: ID, ownerId: OWNER, categories: [], type: 'i', budget: 100});
  }
  mocks.db.query.categories.findMany.mockResolvedValue([{id: CATEGORY}]);
  mocks.db.query.paymentMethods.findMany.mockResolvedValue([{id: PAYMENT}]);
  mocks.attachments.findAttachmentsByTransactionId.mockResolvedValue({attachments: [], totalCount: 0});
  mocks.attachments.generateSignedUrls.mockResolvedValue({signedUrls: new Map()});
  mocks.attachments.deleteAttachmentsByTransactionId.mockResolvedValue(0);
});

for (const entity of entities) {
  describe(`${entity.name} HTTP contracts`, () => {
    it.each(['GET', 'POST', 'PUT', 'DELETE'] as const)(
      'rejects unauthenticated %s without persistence',
      async method => {
        const path = method === 'GET' || method === 'POST' ? '/' : `/${ID}`;
        const response = await requestRouter(entity.router, null, path, {
          method,
          body: method === 'POST' || method === 'PUT' ? entity.body : undefined,
        });
        expect(response.status).toBe(401);
        expect(mocks.db.insert).not.toHaveBeenCalled();
        expect(mocks.db.update).not.toHaveBeenCalled();
        expect(mocks.db.delete).not.toHaveBeenCalled();
      },
    );
    it('returns 404 when a requested ID is absent', async () => {
      mocks.db.query[entity.name].findFirst.mockResolvedValueOnce(undefined);
      expect((await requestRouter(entity.router, OWNER, `/${ID}`, {method: 'GET'})).status).toBe(404);
      const args = mocks.db.query[entity.name].findFirst.mock.calls[0][0];
      const filter = args.where(entity.table, operators);
      const query = new PgDialect().sqlToQuery(filter);
      expect(query.params).toContain(OWNER);
      expect(query.params).toContain(ID);
    });
    it('returns an owned record', async () => {
      expect((await requestRouter(entity.router, OWNER, `/${ID}`, {method: 'GET'})).status).toBe(200);
    });
    it('rejects malformed IDs before database access', async () => {
      expect((await requestRouter(entity.router, OWNER, '/bad-id', {method: 'GET'})).status).toBe(400);
      expect(mocks.db.query[entity.name].findFirst).not.toHaveBeenCalled();
    });
    it('creates records under the authenticated owner', async () => {
      const response = await requestRouter(entity.router, OWNER, '/', {method: 'POST', body: entity.body});
      expect(response.status).toBe(200);
      const values = mocks.chain.values.mock.calls[0][0];
      expect(Array.isArray(values) ? values[0] : values).toMatchObject({ownerId: OWNER});
    });
    it('updates only the owned ID', async () => {
      expect(
        (
          await requestRouter(entity.router, OWNER, `/${ID}`, {
            method: 'PUT',
            body: {...entity.body, name: 'Updated', receiver: 'Updated'},
          })
        ).status,
      ).toBe(200);
      const sql = new PgDialect().sqlToQuery(mocks.chain.where.mock.calls[0][0]);
      expect(sql.params).toContain(OWNER);
      expect(sql.params).toContain(ID);
    });
    it.each(['PUT', 'DELETE'] as const)('returns 404 for missing %s targets', async method => {
      mocks.chain.returning.mockResolvedValueOnce([]);
      const response = await requestRouter(entity.router, OWNER, `/${ID}`, {
        method,
        body: method === 'PUT' ? {...entity.body, name: 'Updated', receiver: 'Updated'} : undefined,
      });
      expect(response.status).toBe(404);
    });
    it('deletes only an owned record', async () => {
      expect((await requestRouter(entity.router, OWNER, `/${ID}`, {method: 'DELETE'})).status).toBe(200);
      const sql = new PgDialect().sqlToQuery(mocks.chain.where.mock.calls[0][0]);
      expect(sql.params).toEqual([OWNER, ID]);
    });
    it('lists owned records with pagination and search', async () => {
      mocks.db.query[entity.name].findMany.mockResolvedValueOnce([]);
      expect((await requestRouter(entity.router, OWNER, '/?from=1&to=3&search=rent', {method: 'GET'})).status).toBe(
        200,
      );
      const args = mocks.db.query[entity.name].findMany.mock.calls[0][0];
      expect(args).toMatchObject({offset: 1, limit: 2});
      expect(new PgDialect().sqlToQuery(args.where()).params).toContain(OWNER);
      expect(args.orderBy(entity.table, operators).length).toBeGreaterThan(0);
    });
    it('returns a generic 500 for persistence failures', async () => {
      mocks.chain.returning.mockRejectedValueOnce(new Error('private database detail'));
      const response = await requestRouter(entity.router, OWNER, '/', {method: 'POST', body: entity.body});
      expect(response.status).toBe(500);
      expect(JSON.stringify(response.body)).not.toContain('private database detail');
    });
    if (entity.batch) {
      it('creates a batch transaction with owned rows', async () => {
        expect(
          (await requestRouter(entity.router, OWNER, '/batch', {method: 'POST', body: [entity.body]})).status,
        ).toBe(200);
        expect(mocks.db.transaction).toHaveBeenCalledOnce();
        expect(mocks.chain.values.mock.calls[0][0][0]).toMatchObject({ownerId: OWNER});
      });
      it('rejects empty batches without writing', async () => {
        expect((await requestRouter(entity.router, OWNER, '/batch', {method: 'POST', body: []})).status).toBe(400);
        expect(mocks.db.transaction).not.toHaveBeenCalled();
      });
      it('rejects batch updates containing a foreign ID', async () => {
        mocks.db.query[entity.name].findMany.mockResolvedValueOnce([]);
        expect(
          (
            await requestRouter(entity.router, OWNER, '/batch', {
              method: 'PUT',
              body: {updates: [{id: ID, data: {name: 'Updated', receiver: 'Updated'}}]},
            })
          ).status,
        ).toBe(404);
        expect(mocks.db.transaction).not.toHaveBeenCalled();
      });
      it('updates batches atomically after owner verification', async () => {
        mocks.db.query[entity.name].findMany.mockResolvedValueOnce([{id: ID}]);
        expect(
          (
            await requestRouter(entity.router, OWNER, '/batch', {
              method: 'PUT',
              body: {updates: [{id: ID, data: {name: 'Updated', receiver: 'Updated'}}]},
            })
          ).status,
        ).toBe(200);
        expect(mocks.db.transaction).toHaveBeenCalledOnce();
      });
      it('reports batch write row-count mismatch as failure', async () => {
        mocks.chain.returning.mockResolvedValueOnce([]);
        expect(
          (await requestRouter(entity.router, OWNER, '/batch', {method: 'POST', body: [entity.body]})).status,
        ).toBe(500);
      });
    }
  });
}

describe('category and payment method merge safeguards', () => {
  it.each([
    ['categories', categoryRouter],
    ['paymentMethods', paymentMethodRouter],
  ] as const)('rejects %s merge when target is in source', async (_name, router) => {
    expect(
      (await requestRouter(router, OWNER, '/merge', {method: 'POST', body: {source: [ID], target: ID}})).status,
    ).toBe(400);
    expect(mocks.db.transaction).not.toHaveBeenCalled();
  });
  it.each([
    ['categories', categoryRouter],
    ['paymentMethods', paymentMethodRouter],
  ] as const)('rejects %s merge when any reference is foreign', async (name, router) => {
    mocks.db.query[name].findMany.mockResolvedValueOnce([{id: ID}]);
    expect(
      (await requestRouter(router, OWNER, '/merge', {method: 'POST', body: {source: [ID], target: CATEGORY}})).status,
    ).toBe(400);
    expect(mocks.db.transaction).not.toHaveBeenCalled();
    const options = mocks.db.query[name].findMany.mock.calls[0][0];
    const table = name === 'categories' ? tables.categories : tables.paymentMethods;
    expect(new PgDialect().sqlToQuery(options.where(table, operators)).params).toContain(OWNER);
  });
  it('merges categories and reassigns dependent references in one transaction', async () => {
    mocks.db.query.categories.findMany.mockResolvedValueOnce([{id: ID}, {id: CATEGORY}]);
    mocks.chain.returning
      .mockResolvedValueOnce([{id: 'transaction'}])
      .mockResolvedValueOnce([{id: 'recurring'}])
      .mockResolvedValueOnce([]);
    const response = await requestRouter(categoryRouter, OWNER, '/merge', {
      method: 'POST',
      body: {source: [ID, ID], target: CATEGORY},
    });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({data: {source: [ID], target: CATEGORY}});
    expect(mocks.db.transaction).toHaveBeenCalledOnce();
    expect(mocks.chain.set.mock.calls).toEqual([[{categoryId: CATEGORY}], [{categoryId: CATEGORY}]]);
    for (const [where] of mocks.chain.where.mock.calls.slice(0, 2))
      expect(new PgDialect().sqlToQuery(where).params).toEqual([OWNER, ID]);
  });
  it('avoids duplicate target budget links and reassigns the remaining budgets', async () => {
    mocks.db.query.categories.findMany.mockResolvedValueOnce([{id: ID}, {id: CATEGORY}]);
    mocks.chain.returning
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{budgetId: 'b1'}, {budgetId: 'b2'}, {budgetId: 'b2'}]);
    mocks.chain.then.mockImplementation((resolve: (value: unknown[]) => unknown) =>
      Promise.resolve([{budgetId: 'b1'}]).then(resolve),
    );
    expect(
      (await requestRouter(categoryRouter, OWNER, '/merge', {method: 'POST', body: {source: [ID], target: CATEGORY}}))
        .status,
    ).toBe(200);
    expect(mocks.chain.values).toHaveBeenCalledWith([{budgetId: 'b2', categoryId: CATEGORY}]);
  });
  it('skips link insertion when affected budgets already contain the target', async () => {
    mocks.db.query.categories.findMany.mockResolvedValueOnce([{id: ID}, {id: CATEGORY}]);
    mocks.chain.returning
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{budgetId: 'b1'}]);
    mocks.chain.then.mockImplementation((resolve: (value: unknown[]) => unknown) =>
      Promise.resolve([{budgetId: 'b1'}]).then(resolve),
    );
    expect(
      (await requestRouter(categoryRouter, OWNER, '/merge', {method: 'POST', body: {source: [ID], target: CATEGORY}}))
        .status,
    ).toBe(200);
    expect(mocks.db.insert).not.toHaveBeenCalled();
  });
});

describe('relational transaction and recurring payment ownership', () => {
  for (const entity of entities.filter(
    entity => entity.name === 'transactions' || entity.name === 'recurringPayments',
  )) {
    it.each(['categories', 'paymentMethods'] as const)(
      `${entity.name} rejects foreign %s on create and batch create`,
      async relation => {
        mocks.db.query[relation].findMany.mockResolvedValue([]);
        for (const path of ['/', '/batch']) {
          expect(
            (
              await requestRouter(entity.router, OWNER, path, {
                method: 'POST',
                body: path === '/' ? entity.body : [entity.body],
              })
            ).status,
          ).toBe(400);
        }
        expect(mocks.db.insert).not.toHaveBeenCalled();
        expect(mocks.db.transaction).not.toHaveBeenCalled();
      },
    );
    it(`${entity.name} rejects replacement references in update and batch update`, async () => {
      mocks.db.query[entity.name].findMany.mockResolvedValue([{id: ID}]);
      mocks.db.query.categories.findMany.mockResolvedValue([]);
      expect((await requestRouter(entity.router, OWNER, `/${ID}`, {method: 'PUT', body: entity.body})).status).toBe(
        400,
      );
      expect(
        (
          await requestRouter(entity.router, OWNER, '/batch', {
            method: 'PUT',
            body: {updates: [{id: ID, data: {categoryId: CATEGORY}}]},
          })
        ).status,
      ).toBe(400);
      expect(mocks.db.update).not.toHaveBeenCalled();
      expect(mocks.db.transaction).not.toHaveBeenCalled();
    });
  }
  it('returns transaction details when attachment retrieval fails', async () => {
    mocks.attachments.findAttachmentsByTransactionId.mockRejectedValueOnce(new Error('storage unavailable'));
    const response = await requestRouter(transactionRouter, OWNER, `/${ID}`, {method: 'GET'});
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({data: {id: ID, attachmentCount: 0, attachments: []}});
  });
});

describe('owner scoped filters and budgeting', () => {
  it('queries owner scoped receivers', async () => {
    mocks.chain.then.mockImplementation((resolve: (value: unknown[]) => unknown) =>
      Promise.resolve([{receiver: 'Shop'}]).then(resolve),
    );
    const response = await requestRouter(transactionRouter, OWNER, '/receiver', {method: 'GET'});
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({data: [{receiver: 'Shop'}]});
    expect(new PgDialect().sqlToQuery(mocks.chain.where.mock.calls[0][0]).params).toEqual([OWNER]);
  });
  it.each(['income', 'expense'])('retains owner and all additional transaction %s filters', async transactionType => {
    const search = new URLSearchParams({
      $dateFrom: '2026-01-01',
      $dateTo: '2026-01-31',
      $categories: CATEGORY,
      $excl_categories: ID,
      $paymentMethods: PAYMENT,
      $excl_paymentMethods: ID,
      $receiver: 'Shop',
      $transactionType: transactionType,
    });
    expect((await requestRouter(transactionRouter, OWNER, `/?${search}`, {method: 'GET'})).status).toBe(200);
    const sql = new PgDialect().sqlToQuery(mocks.db.query.transactions.findMany.mock.calls[0][0].where());
    expect(sql.params).toContain(OWNER);
    expect(sql.params).toContain(CATEGORY);
    expect(sql.params).toContain(PAYMENT);
    expect(sql.params).toContain('Shop');
    expect(sql.sql).toContain('not in');
  });
  it('parses recurring inclusion/exclusion and pause filters', async () => {
    const search = new URLSearchParams({
      $paused: 'true',
      $categories: CATEGORY,
      $excl_categories: ID,
      $paymentMethods: PAYMENT,
      $excl_paymentMethods: ID,
    });
    expect((await requestRouter(recurringPaymentRouter, OWNER, `/?${search}`, {method: 'GET'})).status).toBe(200);
    const sql = new PgDialect().sqlToQuery(mocks.db.query.recurringPayments.findMany.mock.calls[0][0].where());
    expect(sql.params).toContain(OWNER);
    expect(sql.params).toContain(true);
    expect(sql.sql).toContain('not in');
  });
  it('calculates future recurring amounts after today and owner scoped monthly totals', async () => {
    vi.useFakeTimers({toFake: ['Date']});
    vi.setSystemTime(new Date('2026-01-30T12:00:00Z'));
    try {
      mocks.chain.then.mockImplementation((resolve: (value: unknown[]) => unknown) =>
        Promise.resolve([{paidExpenses: 20, upcomingExpenses: 10, receivedIncome: 100, upcomingIncome: 5}]).then(
          resolve,
        ),
      );
      mocks.db.query.recurringPayments.findMany.mockResolvedValueOnce([
        {...recurringBody, executionPlan: 'daily', transferAmount: -3},
        {...recurringBody, executionPlan: 'daily', transferAmount: 2},
      ]);
      const response = await requestRouter(budgetRouter, OWNER, '/estimated', {method: 'GET'});
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: {expenses: {paid: 20, upcoming: 13}, income: {received: 100, upcoming: 7}, freeAmount: 74},
      });
      expect(new PgDialect().sqlToQuery(mocks.chain.where.mock.calls[0][0]).params).toContain(OWNER);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('batch authorization and failure responses', () => {
  for (const entity of entities.filter(entity => entity.batch)) {
    it.each(['POST', 'PUT'] as const)(`${entity.name} requires context for batch %s`, async method => {
      const body =
        method === 'POST' ? [entity.body] : {updates: [{id: ID, data: {receiver: 'Changed', name: 'Changed'}}]};
      expect((await requestRouter(entity.router, null, '/batch', {method, body})).status).toBe(401);
      expect(mocks.db.transaction).not.toHaveBeenCalled();
    });
    it(`${entity.name} aborts batch updates when persistence returns no record`, async () => {
      mocks.db.query[entity.name].findMany.mockResolvedValueOnce([{id: ID}]);
      mocks.chain.returning.mockResolvedValueOnce([]);
      expect(
        (
          await requestRouter(entity.router, OWNER, '/batch', {
            method: 'PUT',
            body: {updates: [{id: ID, data: {name: 'Changed', receiver: 'Changed'}}]},
          })
        ).status,
      ).toBe(500);
    });
  }
});

describe('category statistics and budget balances', () => {
  it('rejects unauthenticated category statistics before querying', async () => {
    expect(
      (await requestRouter(categoryRouter, null, '/stats?from=2026-01-01&to=2026-01-31', {method: 'GET'})).status,
    ).toBe(401);
    expect(mocks.db.select).not.toHaveBeenCalled();
  });
  it('returns category statistics with owner and date filters', async () => {
    mocks.chain.groupBy.mockResolvedValueOnce([
      {categoryId: CATEGORY, categoryName: 'Rent', categoryDescription: null, balance: -10, income: 0, expenses: 10},
    ]);
    const response = await requestRouter(categoryRouter, OWNER, '/stats?from=2026-01-01&to=2026-01-31', {
      method: 'GET',
    });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: {stats: [{balance: -10, income: 0, expenses: 10, category: {id: CATEGORY, name: 'Rent'}}]},
    });
    expect(new PgDialect().sqlToQuery(mocks.chain.where.mock.calls[0][0]).params).toContain(OWNER);
  });
  it('computes include/exclude/empty budget balances from one owner scoped aggregate', async () => {
    mocks.db.query.budgets.findMany.mockResolvedValueOnce([
      {id: 'include', type: 'i', categories: [{categoryId: CATEGORY}, {categoryId: 'no-expenses'}]},
      {id: 'exclude', type: 'e', categories: [{categoryId: CATEGORY}]},
      {id: 'empty', type: 'i', categories: []},
    ]);
    mocks.chain.groupBy.mockResolvedValueOnce([
      {categoryId: CATEGORY, expenses: 30},
      {categoryId: PAYMENT, expenses: 20},
      {categoryId: null, expenses: 999},
    ]);
    const response = await requestRouter(budgetRouter, OWNER, '/', {method: 'GET'});
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [
        {id: 'include', balance: 30},
        {id: 'exclude', balance: 20},
        {id: 'empty', balance: 0},
      ],
    });
    expect(mocks.chain.groupBy).toHaveBeenCalledOnce();
    expect(new PgDialect().sqlToQuery(mocks.chain.where.mock.calls[1][0]).params).toContain(OWNER);
  });
  it('creates and reads budget category links within the same transaction', async () => {
    const response = await requestRouter(budgetRouter, OWNER, '/', {
      method: 'POST',
      body: {...budgetBody, categories: [CATEGORY]},
    });
    expect(response.status).toBe(200);
    expect(mocks.db.transaction).toHaveBeenCalledOnce();
    expect(mocks.chain.values).toHaveBeenCalledWith([{budgetId: ID, categoryId: CATEGORY}]);
  });
  it('changes only added and removed budget links', async () => {
    mocks.chain.then.mockImplementation((resolve: (value: unknown[]) => unknown) =>
      Promise.resolve([{categoryId: PAYMENT}]).then(resolve),
    );
    expect(
      (
        await requestRouter(budgetRouter, OWNER, `/${ID}`, {
          method: 'PUT',
          body: {...budgetBody, categories: [CATEGORY]},
        })
      ).status,
    ).toBe(200);
    expect(mocks.db.delete).toHaveBeenCalledWith(tables.budgetCategories);
    expect(mocks.chain.values).toHaveBeenCalledWith([{budgetId: ID, categoryId: CATEGORY}]);
  });
  it.each(['POST', 'PUT'] as const)('fails explicitly when %s budget reread is missing', async method => {
    mocks.db.query.budgets.findFirst.mockResolvedValueOnce(undefined);
    expect(
      (await requestRouter(budgetRouter, OWNER, method === 'POST' ? '/' : `/${ID}`, {method, body: budgetBody})).status,
    ).toBe(500);
  });
});

describe('recurring occurrence HTTP pagination', () => {
  it('requires context before finding occurrences', async () => {
    expect(
      (
        await requestRouter(recurringPaymentRouter, null, '/occurrences?$dateFrom=2026-01-01&$dateTo=2026-01-03', {
          method: 'GET',
        })
      ).status,
    ).toBe(401);
  });
  it('filters owners, paused plans and relation IDs then paginates expanded rows', async () => {
    mocks.db.query.recurringPayments.findMany.mockResolvedValueOnce([
      {...recurringBody, id: ID, executionPlan: 'daily'},
    ]);
    const params = new URLSearchParams({
      $dateFrom: '2026-01-01',
      $dateTo: '2026-01-03',
      $categories: CATEGORY,
      $excl_categories: ID,
      $paymentMethods: PAYMENT,
      $excl_paymentMethods: ID,
      from: '1',
      to: '2',
    });
    const response = await requestRouter(recurringPaymentRouter, OWNER, `/occurrences?${params}`, {method: 'GET'});
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({totalCount: 3, data: [{scheduledFor: '2026-01-02'}]});
    const query = new PgDialect().sqlToQuery(mocks.db.query.recurringPayments.findMany.mock.calls[0][0].where);
    expect(query.params).toContain(OWNER);
    expect(query.params).toContain(false);
    expect(query.sql).toContain('not in');
  });
  it('can include paused plans and defaults the page size', async () => {
    mocks.db.query.recurringPayments.findMany.mockResolvedValueOnce([]);
    const response = await requestRouter(
      recurringPaymentRouter,
      OWNER,
      '/occurrences?$dateFrom=2026-01-01&$dateTo=2026-01-03&$includePaused=true',
      {method: 'GET'},
    );
    expect(response.status).toBe(200);
    expect(
      new PgDialect().sqlToQuery(mocks.db.query.recurringPayments.findMany.mock.calls[0][0].where).params,
    ).not.toContain(false);
  });
});
