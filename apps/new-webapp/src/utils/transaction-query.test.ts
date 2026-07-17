import {describe, expect, it} from 'vitest';
import {parseTransactionQuery, serializeTransactionQuery, toTransactionApiQuery} from './transaction-query';

describe('transaction URL state', () => {
  it('parses filters, sorting, and pagination from a shareable URL', () => {
    expect(
      parseTransactionQuery({
        search: 'rent',
        from: '2026-07-01',
        to: '2026-07-31',
        type: 'expense',
        category: 'a,b,a',
        paymentMethod: ['p1', 'p2'],
        sort: 'amount',
        order: 'asc',
        page: '2',
        pageSize: '50',
      }),
    ).toEqual({
      search: 'rent',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      type: 'expense',
      categories: ['a', 'b'],
      paymentMethods: ['p1', 'p2'],
      sort: 'amount',
      order: 'asc',
      page: 2,
      pageSize: 50,
    });
  });

  it('falls back safely for unsupported URL values', () => {
    expect(parseTransactionQuery({type: 'transfer', sort: 'receiver', page: '-1', pageSize: '999'})).toMatchObject({
      type: 'all',
      sort: 'date',
      order: 'desc',
      page: 1,
      pageSize: 25,
    });
  });

  it('round-trips non-default view state and maps pagination to the API', () => {
    const query = parseTransactionQuery({search: 'rent', category: 'a,b', page: '3', pageSize: '10'});
    expect(serializeTransactionQuery(query).toString()).toContain('category=a%2Cb');
    expect(toTransactionApiQuery(query)).toMatchObject({search: 'rent', from: 20, to: 30, $categories: ['a', 'b']});
  });
});
