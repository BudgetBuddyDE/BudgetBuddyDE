import type {TExpandedRecurringPayment, TExpandedTransaction} from '@budgetbuddyde/api/types';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  EnvironmentVariableNotSetError,
  createApiKeyRequestConfig,
  createCliLogger,
  determineNextExecutionDate,
  fetchBudgetBuddyOverview,
  fetchBudgetBuddyExport,
  formatPaymentDetails,
  parseCliArgs,
  readConfigFromEnv,
  serializeExport,
} from './index';

const now = '2026-06-28T12:00:00.000Z';
const ownerId = 'user_123';
const category = {
  id: '11111111-1111-4111-8111-111111111111',
  ownerId,
  name: 'Groceries',
  description: null,
  createdAt: now,
  updatedAt: now,
};
const paymentMethod = {
  id: '22222222-2222-4222-8222-222222222222',
  ownerId,
  name: 'Main account',
  provider: 'Bank',
  address: 'DE00',
  description: null,
  createdAt: now,
  updatedAt: now,
};

const transactionFixture = {
  id: '33333333-3333-4333-8333-333333333333',
  ownerId,
  processedAt: now,
  receiver: 'Supermarket',
  transferAmount: -42.5,
  information: 'Weekly shop',
  createdAt: now,
  updatedAt: now,
  category,
  paymentMethod,
} as unknown as TExpandedTransaction;

const recurringPaymentFixture = {
  id: '44444444-4444-4444-8444-444444444444',
  ownerId,
  receiver: 'Streaming',
  transferAmount: -12.99,
  information: null,
  createdAt: now,
  updatedAt: now,
  category,
  paymentMethod,
  paused: false,
  executeAt: 15,
} as unknown as TExpandedRecurringPayment;

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('api-key-client example', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires an API key', () => {
    expect(() => readConfigFromEnv({BUDGETBUDDY_BACKEND_URL: 'https://backend.example.test'})).toThrow(
      new EnvironmentVariableNotSetError('BUDGETBUDDY_API_KEY'),
    );
  });

  it('requires a backend URL', () => {
    expect(() => readConfigFromEnv({BUDGETBUDDY_API_KEY: 'bb-test-key'})).toThrow(
      new EnvironmentVariableNotSetError('BUDGETBUDDY_BACKEND_URL'),
    );
  });

  it('creates the request config expected by the backend API key middleware', () => {
    expect(createApiKeyRequestConfig('bb-test-key')).toEqual({
      headers: {
        Accept: 'application/json',
        'x-api-key': 'bb-test-key',
      },
    });
  });

  it('formats transaction details with the processed date and note', () => {
    expect(formatPaymentDetails(transactionFixture)).toBe('date 2026-06-28; note Weekly shop');
  });

  it('determines the next recurring payment execution date', () => {
    expect(determineNextExecutionDate(15, new Date('2026-06-28T12:00:00.000Z')).toISOString()).toBe(
      '2026-07-15T00:00:00.000Z',
    );
    expect(determineNextExecutionDate(30, new Date('2026-06-28T12:00:00.000Z')).toISOString()).toBe(
      '2026-06-30T00:00:00.000Z',
    );
  });

  it('formats recurring payment details with execution information', () => {
    expect(formatPaymentDetails(recurringPaymentFixture, new Date('2026-06-28T12:00:00.000Z'))).toBe(
      'execution day 15; next execution 2026-07-15',
    );
  });

  it('parses export CLI arguments', () => {
    expect(parseCliArgs(['--entity', 'transactions', '--format', 'csv', '--id', 'tx_123'])).toEqual({
      entity: 'transactions',
      format: 'csv',
      id: 'tx_123',
      verbose: false,
    });
    expect(parseCliArgs(['--verbose'])).toEqual({entity: 'all', format: 'json', verbose: true});
    expect(parseCliArgs([])).toEqual({entity: 'all', format: 'json', verbose: false});
    expect(() => parseCliArgs(['--entity', 'unknown'])).toThrow('--entity must be one of');
    expect(() => parseCliArgs(['--entity', 'all', '--id', 'tx_123'])).toThrow(
      '--id can only be used with a single --entity',
    );
  });

  it('configures the CLI logger with info and debug levels', () => {
    expect(createCliLogger().level).toBe('info');
    expect(createCliLogger(true).level).toBe('debug');
  });

  it('serializes export data as JSON and CSV', () => {
    const exportResult = {transactions: [transactionFixture as unknown as Record<string, unknown>]};

    expect(serializeExport(exportResult, 'json')).toContain('"transactions"');
    expect(serializeExport(exportResult, 'csv')).toContain('# transactions');
    expect(serializeExport(exportResult, 'csv')).toContain('Supermarket');
  });

  it('fetches transactions and recurring payments through the API package', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          status: 200,
          data: [
            {
              id: '33333333-3333-4333-8333-333333333333',
              ownerId,
              processedAt: now,
              receiver: 'Supermarket',
              transferAmount: -42.5,
              information: null,
              createdAt: now,
              updatedAt: now,
              category,
              paymentMethod,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          status: 200,
          data: [
            {
              id: '44444444-4444-4444-8444-444444444444',
              ownerId,
              receiver: 'Streaming',
              transferAmount: -12.99,
              information: null,
              createdAt: now,
              updatedAt: now,
              category,
              paymentMethod,
              paused: false,
              executeAt: 15,
            },
          ],
        }),
      );

    const overview = await fetchBudgetBuddyOverview({
      apiKey: 'bb-test-key',
      backendUrl: 'https://backend.example.test',
      limit: 3,
    });

    expect(overview.transactions).toHaveLength(1);
    expect(overview.recurringPayments).toHaveLength(1);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://backend.example.test/api/transaction?from=0&to=3',
      expect.objectContaining({
        headers: expect.any(Headers),
        method: 'GET',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://backend.example.test/api/recurringPayment?from=0&to=3',
      expect.objectContaining({
        headers: expect.any(Headers),
        method: 'GET',
      }),
    );

    const firstRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(firstRequest.headers).toBeInstanceOf(Headers);
    expect((firstRequest.headers as Headers).get('x-api-key')).toBe('bb-test-key');
  });

  it('exports a single category by id through the API package', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        status: 200,
        data: category,
      }),
    );

    const exported = await fetchBudgetBuddyExport(
      {
        apiKey: 'bb-test-key',
        backendUrl: 'https://backend.example.test',
        limit: 3,
      },
      {entity: 'categories', format: 'json', id: category.id, verbose: false},
    );

    expect(exported.categories).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://backend.example.test/api/category/${category.id}`,
      expect.objectContaining({method: 'GET'}),
    );
  });
});
