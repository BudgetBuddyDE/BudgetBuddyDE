import {afterEach, describe, expect, it, vi} from 'vitest';
import {ApplicationDataService} from './applicationData.service';
import {BudgetService} from './budget.service';
import {CategoryService} from './category.service';
import {RecurringPaymentService} from './recurringPayment.service';
import {resetRequestCacheForTests} from './requestCache';
import {TransactionService} from './transaction.service';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {headers: {'content-type': 'application/json'}});

describe('domain service operations', () => {
  afterEach(() => {
    resetRequestCacheForTests();
    vi.unstubAllGlobals();
  });

  it('serializes category stats dates and transforms merge source IDs to a Set', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({status: 200, data: {from: '2026-01-01', to: '2026-01-31', stats: []}}))
      .mockResolvedValueOnce(
        jsonResponse({
          status: 200,
          data: {source: ['11111111-1111-4111-8111-111111111111'], target: '22222222-2222-4222-8222-222222222222'},
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const service = new CategoryService('https://api.example');

    const [stats, statsError] = await service.getCategoryStats({
      from: new Date('2026-01-01T00:00:00Z'),
      to: new Date('2026-01-31T00:00:00Z'),
    });
    expect(statsError).toBeNull();
    expect(stats?.from).toBeInstanceOf(Date);
    expect(fetchMock.mock.calls[0][0]).toContain('/stats?from=2026-01-01&to=2026-01-31');

    const [merged, mergeError] = await service.merge({
      source: ['11111111-1111-4111-8111-111111111111'] as never,
      target: '22222222-2222-4222-8222-222222222222' as never,
    });
    expect(mergeError).toBeNull();
    expect(merged?.source).toBeInstanceOf(Set);
  });

  it('unwraps estimated budget response data and propagates validation errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          status: 200,
          data: {expenses: {paid: 1, upcoming: 2}, income: {received: 3, upcoming: 4}, freeAmount: 5},
        }),
      )
      .mockResolvedValueOnce(jsonResponse({status: 200, data: {unexpected: true}}));
    vi.stubGlobal('fetch', fetchMock);
    const service = new BudgetService('https://api.example');
    await expect(service.getEstimatedBudget()).resolves.toEqual([
      {expenses: {paid: 1, upcoming: 2}, income: {received: 3, upcoming: 4}, freeAmount: 5},
      null,
    ]);
    const [data, error] = await service.getEstimatedBudget();
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });

  it('sends recurring occurrence filters and executes with POST', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({status: 200, data: []}))
      .mockResolvedValueOnce(jsonResponse({status: 200, data: null}));
    vi.stubGlobal('fetch', fetchMock);
    const service = new RecurringPaymentService('https://api.example');
    await service.getOccurrences({from: '2026-01-01', to: '2026-02-01'} as never);
    await service.executePayment('payment-id');
    expect(fetchMock.mock.calls[0][0]).toContain('/occurrences?');
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.example/api/recurringPayment/payment-id/execute');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('POST');
  });

  it('uploads attachments as multipart and omits body when deleting all attachments', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({status: 200, data: []}))
      .mockResolvedValueOnce(jsonResponse({status: 200, data: null}));
    vi.stubGlobal('fetch', fetchMock);
    const service = new TransactionService('https://api.example');
    await service.uploadTransactionAttachments('txn-id', [new File(['receipt'], 'receipt.png', {type: 'image/png'})]);
    await service.deleteTransactionAttachments('txn-id');
    expect(fetchMock.mock.calls[0][1]?.body).toBeInstanceOf(FormData);
    expect((fetchMock.mock.calls[0][1]?.body as FormData).get('files')).toBeInstanceOf(File);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({method: 'DELETE', body: undefined});
  });

  it('imports an archive with mode and validates the import response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        status: 200,
        data: {
          mode: 'preview',
          preview: {
            categories: [],
            'payment-methods': [],
            transactions: [],
            'recurring-payments': [],
            budgets: [],
          },
          resources: Object.fromEntries(
            ['categories', 'payment-methods', 'transactions', 'recurring-payments', 'budgets'].map(resource => [
              resource,
              {created: [], failed: [], skipped: []},
            ]),
          ),
          summary: {created: 0, failed: 0, received: 0, skipped: 0},
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const [result, error] = await new ApplicationDataService('https://api.example').importArchive(
      new File(['archive'], 'data.zip'),
      'preview',
    );
    expect(error).toBeNull();
    expect(result?.mode).toBe('preview');
    const body = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(body.get('mode')).toBe('preview');
    expect(body.get('archive')).toBeInstanceOf(File);
  });
});
