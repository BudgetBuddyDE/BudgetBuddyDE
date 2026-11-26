import {mock, type AnyMock} from './mock';

type QueryMock = {findFirst: AnyMock; findMany: AnyMock};
type QueryRegistry = Record<string, QueryMock>;

function createRelation(): QueryMock {
  return {findFirst: mock(async () => undefined), findMany: mock(async () => [])};
}

/**
 * A single db double shared by every non-integration backend test file. Test
 * files configure the functions they need and must not replace the module.
 */
export const dbQuery: QueryRegistry = {
  attachments: createRelation(),
  budgets: createRelation(),
  categories: createRelation(),
  paymentMethods: createRelation(),
  preferences: createRelation(),
  recurringPayments: createRelation(),
  transactions: createRelation(),
};

const CHAIN_METHODS = [
  'from',
  'where',
  'groupBy',
  'limit',
  'offset',
  'orderBy',
  'leftJoin',
  'innerJoin',
  'values',
  'set',
  'onConflictDoNothing',
  'onConflictDoUpdate',
] as const;

type MockChain = Record<(typeof CHAIN_METHODS)[number], AnyMock> & {
  returning: AnyMock;
};

/** Drizzle-like chain whose every terminal operation resolves to `result`. */
export function createChain(result: unknown = []): MockChain {
  const chain = {} as MockChain;
  for (const method of CHAIN_METHODS) chain[method] = mock(() => chain);
  chain.returning = mock(async () => result);
  return chain;
}

export const db = {
  query: dbQuery,
  select: mock(),
  insert: mock(),
  update: mock(),
  delete: mock(),
  transaction: mock(),
};

export const pool = {end: mock()};
export const checkConnection = mock(async () => true);

export function resetDbMock(): void {
  for (const relation of Object.values(dbQuery)) {
    relation.findFirst.mockReset();
    relation.findMany.mockReset();
    relation.findFirst.mockResolvedValue(undefined);
    relation.findMany.mockResolvedValue([]);
  }
  for (const method of ['select', 'insert', 'update', 'delete'] as const) {
    db[method].mockReset();
    db[method].mockImplementation(() => createChain());
  }
  db.transaction.mockReset();
  db.transaction.mockImplementation(async (callback: (transaction: typeof db) => unknown) => callback(db));
  pool.end.mockReset();
  checkConnection.mockReset();
  checkConnection.mockResolvedValue(true);
}
