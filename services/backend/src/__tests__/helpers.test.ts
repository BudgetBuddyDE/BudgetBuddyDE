import {categories} from '@budgetbuddyde/db/backend';
import {PgDialect} from 'drizzle-orm/pg-core';
import {z} from 'zod';
import {mapWithConcurrency, mapWithConcurrencySettled} from '../lib/concurrency';
import {assembleFilter} from '../router/assembleFilter';
import {paginationFields, paginationWindow, refinePagination} from '../router/pagination';

vi.mock('../config', () => ({config: {pagination: {maxPageSize: 100}}}));

describe('pagination contract', () => {
  const schema = z.object(paginationFields).superRefine(refinePagination);
  it.each([
    [{}, {offset: undefined, limit: undefined}],
    [{from: 3}, {offset: 3, limit: undefined}],
    [{to: 5}, {offset: undefined, limit: 5}],
    [
      {from: 3, to: 5},
      {offset: 3, limit: 2},
    ],
    [
      {from: 3, to: 3},
      {offset: 3, limit: 0},
    ],
  ])('translates %j to an exclusive window', (query, expected) => {
    expect(schema.safeParse(query).success).toBe(true);
    expect(paginationWindow(query)).toEqual(expected);
  });
  it.each([{from: -1}, {from: 1.5}, {from: 5, to: 4}, {to: 101}])('rejects invalid window %j', query => {
    expect(schema.safeParse(query).success).toBe(false);
  });
  it('coerces HTTP numbers and accepts the maximum size', () => {
    expect(schema.parse({from: '5', to: '105'})).toEqual({from: 5, to: 105});
  });
});

describe('owner scoped filters', () => {
  const dialect = new PgDialect();
  it('always retains the owner without a search', () => {
    const filter = assembleFilter(categories, {ownerColumnName: 'ownerId', ownerValue: 'owner'}, {});
    const query = dialect.sqlToQuery(filter!);
    expect(query.sql).toContain('owner_id');
    expect(query.params).toEqual(['owner']);
  });
  it.each([{columns: ['name'] as const}, {columns: ['name', 'description'] as const}])(
    'searches columns %j without losing owner',
    ({columns}) => {
      const filter = assembleFilter(
        categories,
        {ownerColumnName: 'ownerId', ownerValue: 'owner'},
        {
          searchTerm: 'rent',
          searchableColumnName: [...columns],
        },
      );
      const query = dialect.sqlToQuery(filter!);
      expect(query.params).toEqual(['owner', ...columns.map(() => '%rent%')]);
      expect(query.sql).toContain('ilike');
      if (columns.length > 1) expect(query.sql).toContain(' or ');
    },
  );
  it('combines every supported comparison with the owner', () => {
    const filter = assembleFilter(categories, {ownerColumnName: 'ownerId', ownerValue: 'owner'}, {}, [
      {columnName: 'name', operator: 'eq', value: 'rent'},
      {columnName: 'name', operator: 'lte', value: 'z'},
      {columnName: 'name', operator: 'gte', value: 'a'},
      {columnName: 'id', operator: 'in', value: ['one', 'two']},
      {columnName: 'id', operator: 'notIn', value: ['three']},
    ]);
    const query = dialect.sqlToQuery(filter!);
    expect(query.params).toEqual(['owner', 'rent', 'z', 'a', 'one', 'two', 'three']);
    expect(query.sql).toContain('not in');
    expect(query.sql).toContain('<=');
    expect(query.sql).toContain('>=');
  });
  it('ignores an empty search column list', () => {
    const filter = assembleFilter(
      categories,
      {ownerColumnName: 'ownerId', ownerValue: 'owner'},
      {
        searchTerm: 'rent',
        searchableColumnName: [],
      },
    );
    expect(dialect.sqlToQuery(filter!).params).toEqual(['owner']);
  });
});

describe('bounded concurrency', () => {
  it('handles empty inputs without invoking the mapper', async () => {
    const mapper = vi.fn();
    expect(await mapWithConcurrency([], 4, mapper)).toEqual([]);
    expect(mapper).not.toHaveBeenCalled();
  });
  it('caps work in flight and preserves input order', async () => {
    let active = 0;
    let maximum = 0;
    const result = await mapWithConcurrency([0, 1, 2, 3, 4], 2, async (value, index) => {
      active++;
      maximum = Math.max(active, maximum);
      await new Promise(resolve => setTimeout(resolve, value === 0 ? 10 : 1));
      active--;
      return `${value}:${index}`;
    });
    expect(maximum).toBe(2);
    expect(result).toEqual(['0:0', '1:1', '2:2', '3:3', '4:4']);
  });
  it('uses at least one worker when configured with zero', async () => {
    expect(await mapWithConcurrency([1, 2], 0, async item => item * 2)).toEqual([2, 4]);
  });
  it('rejects mapper errors', async () => {
    await expect(
      mapWithConcurrency([1], 2, async () => {
        throw new Error('failed');
      }),
    ).rejects.toThrow('failed');
  });
  it('settles errors independently and continues later work', async () => {
    const error = new Error('failed');
    expect(
      await mapWithConcurrencySettled([1, 2, 3], 1, async item => {
        if (item === 2) throw error;
        return item;
      }),
    ).toEqual([
      {status: 'fulfilled', value: 1},
      {status: 'rejected', reason: error},
      {status: 'fulfilled', value: 3},
    ]);
  });
});
