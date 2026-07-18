import {afterEach, describe, expect, it, vi} from 'vitest';
import {BackendError, ResponseNotJsonError} from '../error';
import {CategoryService} from './category.service';
import {PaymentMethodService} from './paymentMethod.service';
import {RecurringPaymentService} from './recurringPayment.service';
import {resetRequestCacheForTests} from './requestCache';
import {TransactionService} from './transaction.service';
import {BatchCreateCategoryPayload, BatchUpdateCategoryPayload} from '../types/schemas/category.schema';
import {BatchCreatePaymentMethodPayload, BatchUpdatePaymentMethodPayload} from '../types/schemas/paymentMethod.schema';
import {
  BatchCreateRecurringPaymentPayload,
  BatchUpdateRecurringPaymentPayload,
} from '../types/schemas/recurringPayment.schema';
import {BatchCreateTransactionPayload, BatchUpdateTransactionPayload} from '../types/schemas/transaction.schema';

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {'content-type': 'application/json', ...(init?.headers || {})},
  });

const services = [
  {path: '/api/category', service: new CategoryService('https://example.test')},
  {path: '/api/paymentMethod', service: new PaymentMethodService('https://example.test')},
  {path: '/api/transaction', service: new TransactionService('https://example.test')},
  {path: '/api/recurringPayment', service: new RecurringPaymentService('https://example.test')},
] as const;

describe('EntityService batch transport', () => {
  afterEach(() => {
    resetRequestCacheForTests();
    vi.unstubAllGlobals();
  });

  it.each(services)(
    'sends createMany to $path/batch with the shared CRUD response contract',
    async ({path, service}) => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({status: 200, data: []}));
      vi.stubGlobal('fetch', fetchMock);
      const payload = [{name: 'Batch row'}];

      const [result, error] = await service.createMany(payload as never);

      expect(error).toBeNull();
      expect(result).toEqual({status: 200, data: []});
      expect(fetchMock).toHaveBeenCalledOnce();
      const [requestUrl, requestInit] = fetchMock.mock.calls[0];
      expect(requestUrl).toBe(`https://example.test${path}/batch`);
      expect(requestInit).toMatchObject({method: 'POST', credentials: 'include', body: JSON.stringify(payload)});
      expect(new Headers(requestInit.headers).get('content-type')).toBe('application/json');
    },
  );

  it.each(services)('sends updateMany to $path/batch with ordered update entries', async ({path, service}) => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({status: 200, data: []}));
    vi.stubGlobal('fetch', fetchMock);
    const updates = [{id: 'id-1', data: {name: 'Updated row'}}];

    const [result, error] = await service.updateMany(updates as never);

    expect(error).toBeNull();
    expect(result).toEqual({status: 200, data: []});
    expect(fetchMock).toHaveBeenCalledOnce();
    const [requestUrl, requestInit] = fetchMock.mock.calls[0];
    expect(requestUrl).toBe(`https://example.test${path}/batch`);
    expect(requestInit).toMatchObject({method: 'PUT', credentials: 'include', body: JSON.stringify({updates})});
    expect(new Headers(requestInit.headers).get('content-type')).toBe('application/json');
  });

  it('requires bounded non-empty create batches and unique update IDs', () => {
    const schemas = [
      {
        create: BatchCreateCategoryPayload,
        update: BatchUpdateCategoryPayload,
        payload: {name: 'Category'},
      },
      {
        create: BatchCreatePaymentMethodPayload,
        update: BatchUpdatePaymentMethodPayload,
        payload: {name: 'Method', provider: 'Provider', address: 'Address'},
      },
      {
        create: BatchCreateTransactionPayload,
        update: BatchUpdateTransactionPayload,
        payload: {
          categoryId: '00000000-0000-4000-8000-000000000001',
          paymentMethodId: '00000000-0000-4000-8000-000000000002',
          processedAt: new Date(),
          receiver: 'Receiver',
          transferAmount: 1,
        },
      },
      {
        create: BatchCreateRecurringPaymentPayload,
        update: BatchUpdateRecurringPaymentPayload,
        payload: {
          categoryId: '00000000-0000-4000-8000-000000000001',
          paymentMethodId: '00000000-0000-4000-8000-000000000002',
          executeAt: 1,
          paused: false,
          receiver: 'Receiver',
          transferAmount: 1,
        },
      },
    ];

    for (const {create, update, payload} of schemas) {
      expect(create.safeParse([]).success).toBe(false);
      expect(create.safeParse(Array.from({length: 101}, () => payload)).success).toBe(false);
      expect(
        update.safeParse({
          updates: [
            {id: '00000000-0000-4000-8000-000000000001', data: {}},
            {id: '00000000-0000-4000-8000-000000000001', data: {}},
          ],
        }).success,
      ).toBe(false);
    }
  });

  it('preserves HTTP, non-JSON, and response-schema errors for both batch methods', async () => {
    const service = new CategoryService('https://example.test');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('nope', {status: 503, statusText: 'Unavailable'}))
      .mockResolvedValueOnce(new Response('nope', {headers: {'content-type': 'text/plain'}}))
      .mockResolvedValueOnce(jsonResponse({status: 'invalid', data: []}))
      .mockResolvedValueOnce(new Response('nope', {headers: {'content-type': 'text/plain'}}))
      .mockResolvedValueOnce(jsonResponse({status: 'invalid', data: []}));
    vi.stubGlobal('fetch', fetchMock);

    const [, createHttpError] = await service.createMany([{}] as never);
    const [, createNonJsonError] = await service.createMany([{}] as never);
    const [, createSchemaError] = await service.createMany([{}] as never);
    const [, updateNonJsonError] = await service.updateMany([] as never);
    const [, updateSchemaError] = await service.updateMany([] as never);

    expect(createHttpError).toBeInstanceOf(BackendError);
    expect(createNonJsonError).toBeInstanceOf(ResponseNotJsonError);
    expect(createSchemaError).toBeInstanceOf(Error);
    expect(createSchemaError?.message).toContain('Invalid input');
    expect(updateNonJsonError).toBeInstanceOf(ResponseNotJsonError);
    expect(updateSchemaError).toBeInstanceOf(Error);
  });
});
