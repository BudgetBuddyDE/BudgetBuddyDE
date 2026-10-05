import * as tables from '@budgetbuddyde/db/backend';
import {PgDialect} from 'drizzle-orm/pg-core';
import {requestRouter} from './router.test-utils';
import {insightsRouter} from '../router/insights.router';

const {report, chain, db} = vi.hoisted(() => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn(),
  };
  return {report: vi.fn(), chain, db: {select: vi.fn(() => chain)}};
});
vi.mock('../lib/insights/report', () => ({buildInsightsReport: report}));
vi.mock('../db', () => ({db}));
vi.mock('../config', () => ({config: {timezone: 'UTC'}}));
beforeEach(() => {
  vi.clearAllMocks();
  chain.orderBy.mockResolvedValue([]);
  report.mockResolvedValue({summary: {income: {value: 10}}});
});
it.each(['/balance', '/category-balance', '/report?$dateFrom=2026-01-01&$dateTo=2026-01-31'])(
  'requires a session for %s',
  async path => {
    expect((await requestRouter(insightsRouter, null, path, {method: 'GET'})).status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
  },
);
it('parses report dates, filters and defaults before passing the authenticated owner', async () => {
  const id = '00000000-0000-4000-8000-000000000001';
  const response = await requestRouter(
    insightsRouter,
    'owner',
    `/report?$dateFrom=2026-01-01&$dateTo=2026-01-31&$categories=${id}&$paymentMethods=${id}`,
    {method: 'GET'},
  );
  expect(response.status).toBe(200);
  expect(report).toHaveBeenCalledWith(
    'owner',
    expect.objectContaining({
      $dateFrom: new Date('2026-01-01'),
      $dateTo: new Date('2026-01-31'),
      $categories: [id],
      $paymentMethods: [id],
      $granularity: 'auto',
      $comparison: 'previous',
    }),
  );
});
it('rejects invalid report query before querying', async () => {
  expect(
    (await requestRouter(insightsRouter, 'owner', '/report?$dateFrom=bad&$dateTo=2026-01-31', {method: 'GET'})).status,
  ).toBe(400);
  expect(report).not.toHaveBeenCalled();
});
it.each(['/balance', '/category-balance'])('filters %s by owner and optional date bounds', async path => {
  chain.orderBy.mockResolvedValue([
    {
      date: '2026-01-01',
      income: 20,
      expenses: 10,
      balance: 10,
      categoryId: 'category',
      categoryName: 'Rent',
      categoryDescription: null,
    },
  ]);
  const response = await requestRouter(insightsRouter, 'owner', `${path}?$dateFrom=2026-01-01&$dateTo=2026-01-31`, {
    method: 'GET',
  });
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    data: [{date: '2026-01-01T00:00:00.000Z', income: 20, expenses: 10, balance: 10}],
  });
  const query = new PgDialect().sqlToQuery(chain.where.mock.calls[0][0]);
  expect(query.params).toContain('owner');
  expect(query.sql).toContain('>=');
  expect(query.sql).toContain('<=');
  expect(chain.from).toHaveBeenCalledWith(
    path === '/balance' ? tables.transactionHistorySummaryView : tables.transactionHistoryView,
  );
});
it.each(['/balance', '/category-balance'])('accepts Date values and absent date filters for %s', async path => {
  chain.orderBy.mockResolvedValue([{date: new Date('2026-01-01'), income: 0, expenses: 0, balance: 0}]);
  expect((await requestRouter(insightsRouter, 'owner', path, {method: 'GET'})).status).toBe(200);
  expect(new PgDialect().sqlToQuery(chain.where.mock.calls[0][0]).params).toEqual(['owner']);
});
