import {PgDialect} from 'drizzle-orm/pg-core';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {getAttachment} from '../domain/attachment';
import {
  createRecurringPayment,
  getRecurringPayment,
  listRecurringPaymentOccurrences,
  listRecurringPayments,
  removeRecurringPayment,
  updateRecurringPayment,
} from '../domain/recurringPayment';
import {
  createTransaction,
  getTransaction,
  listTransactionAttachments,
  listTransactions,
  removeTransaction,
  updateTransaction,
} from '../domain/transaction';

const mocks = vi.hoisted(() => ({
  transactionFindFirst: vi.fn(),
  transactionFindMany: vi.fn(),
  recurringFindFirst: vi.fn(),
  recurringFindMany: vi.fn(),
  categoryFindMany: vi.fn(),
  paymentMethodFindMany: vi.fn(),
  returning: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  select: vi.fn(),
  verifyOwnership: vi.fn(),
  generateSignedUrl: vi.fn(),
  generateSignedUrls: vi.fn(),
  findAttachmentsByTransactionId: vi.fn(),
  invalidate: vi.fn(),
}));
vi.mock('../db', () => ({
  db: {
    query: {
      transactions: {findFirst: mocks.transactionFindFirst, findMany: mocks.transactionFindMany},
      recurringPayments: {findFirst: mocks.recurringFindFirst, findMany: mocks.recurringFindMany},
      categories: {findMany: mocks.categoryFindMany},
      paymentMethods: {findMany: mocks.paymentMethodFindMany},
    },
    insert: mocks.insert,
    update: mocks.update,
    delete: mocks.remove,
    select: mocks.select,
  },
}));
vi.mock('../domain/cache', () => ({invalidateDomainMutation: mocks.invalidate}));
vi.mock('../config', () => ({
  config: {
    timezone: 'Europe/Berlin',
    pagination: {maxPageSize: 100},
    attachments: {transactionPreviewLimit: 3},
    getRequiredObjectStorageConfig: () => ({bucketName: 'test'}),
  },
}));
vi.mock('../lib', () => ({logger: {child: () => ({error: vi.fn()})}}));
vi.mock('../lib/attachment', () => ({
  TransactionAttachmentHandler: vi.fn(() => ({
    verifyOwnership: mocks.verifyOwnership,
    generateSignedUrl: mocks.generateSignedUrl,
    generateSignedUrls: mocks.generateSignedUrls,
    findAttachmentsByTransactionId: mocks.findAttachmentsByTransactionId,
  })),
}));
const id = '00000000-0000-4000-8000-000000000001';
const categoryId = '00000000-0000-4000-8000-000000000002';
const paymentMethodId = '00000000-0000-4000-8000-000000000003';
const transaction = {
  categoryId,
  paymentMethodId,
  processedAt: '2026-10-05T12:00:00.000Z',
  receiver: 'Shop',
  transferAmount: -15,
  information: null,
};
const recurring = {
  categoryId,
  paymentMethodId,
  receiver: 'Shop',
  transferAmount: -15,
  information: null,
  startsOn: '2026-10-05',
  executionPlan: 'monthly' as const,
  paused: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.categoryFindMany.mockResolvedValue([{id: categoryId}]);
  mocks.paymentMethodFindMany.mockResolvedValue([{id: paymentMethodId}]);
  mocks.returning.mockResolvedValue([{id}]);
  mocks.insert.mockReturnValue({values: vi.fn(() => ({returning: mocks.returning}))});
  mocks.update.mockReturnValue({set: vi.fn(() => ({where: vi.fn(() => ({returning: mocks.returning}))}))});
  mocks.remove.mockReturnValue({where: vi.fn(() => ({returning: mocks.returning}))});
  mocks.transactionFindFirst.mockResolvedValue(undefined);
  mocks.recurringFindFirst.mockResolvedValue(undefined);
  mocks.transactionFindMany.mockResolvedValue([]);
  mocks.recurringFindMany.mockResolvedValue([]);
  mocks.select.mockReturnValue({
    from: vi.fn(() => ({where: vi.fn(() => ({limit: vi.fn().mockResolvedValue([{count: '0'}])}))})),
  });
  mocks.generateSignedUrls.mockResolvedValue({signedUrls: new Map()});
  mocks.findAttachmentsByTransactionId.mockResolvedValue({attachments: [], totalCount: 0});
  mocks.verifyOwnership.mockResolvedValue(undefined);
  mocks.generateSignedUrl.mockResolvedValue('https://signed.example/file');
});

describe('shared transaction operations', () => {
  it('validates direct input before touching the database', async () => {
    await expect(listTransactions('user-a', {from: -1})).rejects.toThrow();
    await expect(listTransactions('user-a', {from: 3, to: 2})).rejects.toThrow();
    await expect(listTransactions('user-a', {to: 101})).rejects.toThrow();
    await expect(getTransaction('user-a', 'invalid')).rejects.toThrow();
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.transactionFindFirst).not.toHaveBeenCalled();
  });
  it('keeps owner-scoped reads and the REST response metadata', async () => {
    const result = await getTransaction('user-a', id);
    expect(result).toMatchObject({status: 404, from: 'db', message: `Transaction ${id} not found`});
    const {transactions} = await import('@budgetbuddyde/db/backend');
    const {and, eq} = await import('drizzle-orm');
    const where = mocks.transactionFindFirst.mock.calls[0][0].where(transactions, {and, eq});
    expect(new PgDialect().sqlToQuery(where).params).toEqual(['user-a', id]);
  });
  it('returns list count and tolerates empty attachment previews', async () => {
    expect(
      await listTransactions('user-a', {
        search: 'Shop',
        $transactionType: 'expense',
        $dateFrom: '2026-10-05',
        $dateTo: '2026-10-05',
        $categories: categoryId,
        $excl_categories: categoryId,
        $paymentMethods: paymentMethodId,
        $excl_paymentMethods: paymentMethodId,
        $receiver: 'Shop',
      }),
    ).toMatchObject({status: 200, totalCount: 0, data: [], from: 'db'});
    expect(mocks.transactionFindMany.mock.calls[0][0]).toMatchObject({with: {category: true, paymentMethod: true}});
  });
  it('falls back to transaction data when signing attachments fails', async () => {
    mocks.transactionFindFirst.mockResolvedValue({id, ...transaction});
    mocks.findAttachmentsByTransactionId.mockRejectedValue(new Error('storage offline'));
    expect(await getTransaction('user-a', id)).toMatchObject({
      status: 200,
      data: {id, attachments: [], attachmentCount: 0},
    });
  });
  it('passes the authenticated owner and pagination to attachment lookup', async () => {
    expect(await listTransactionAttachments('user-a', id, {from: 1, to: 3, ttl: 120})).toMatchObject({
      status: 200,
      totalCount: 0,
      data: [],
    });
    expect(mocks.findAttachmentsByTransactionId).toHaveBeenCalledWith('user-a', id, {from: 1, to: 3, ttl: 120});
  });
  it('maps attachment lookup failures to the shared error response', async () => {
    mocks.findAttachmentsByTransactionId.mockRejectedValue(new Error('offline'));
    expect(await listTransactionAttachments('user-a', id)).toMatchObject({
      status: 500,
      message: 'Internal Server Error',
    });
  });
  it('invalidates the same caches for successful create, update and delete', async () => {
    expect((await createTransaction('user-a', {...transaction, ownerId: 'other'})).status).toBe(200);
    expect((await updateTransaction('user-a', id, transaction)).status).toBe(200);
    expect((await removeTransaction('user-a', id)).status).toBe(200);
    expect(mocks.invalidate.mock.calls).toEqual(Array.from({length: 3}, () => ['user-a', '/api/transaction']));
    expect(mocks.insert.mock.results[0].value.values).toHaveBeenCalledWith([
      expect.objectContaining({ownerId: 'user-a'}),
    ]);
  });
  it('does not invalidate on foreign references, missing records or failed writes', async () => {
    mocks.categoryFindMany.mockResolvedValue([]);
    expect((await createTransaction('user-a', transaction)).status).toBe(400);
    expect((await updateTransaction('user-a', id, transaction)).status).toBe(400);
    mocks.returning.mockResolvedValue([]);
    expect((await removeTransaction('user-a', id)).status).toBe(404);
    mocks.categoryFindMany.mockResolvedValue([{id: categoryId}]);
    expect((await createTransaction('user-a', transaction)).status).toBe(500);
    expect((await updateTransaction('user-a', id, transaction)).status).toBe(404);
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});

describe('shared recurring payment operations', () => {
  it('validates occurrence date windows before querying', async () => {
    await expect(
      listRecurringPaymentOccurrences('user-a', {$dateFrom: '2026-10-06', $dateTo: '2026-10-05'}),
    ).rejects.toThrow();
    await expect(
      listRecurringPaymentOccurrences('user-a', {$dateFrom: '2026-01-01', $dateTo: '2027-01-02'}),
    ).rejects.toThrow();
    expect(mocks.recurringFindMany).not.toHaveBeenCalled();
  });
  it('supports boolean and HTTP string filters for the same projected occurrences', async () => {
    const a = await listRecurringPaymentOccurrences('user-a', {
      $dateFrom: '2026-10-01',
      $dateTo: '2026-10-31',
      $includePaused: true,
    });
    const b = await listRecurringPaymentOccurrences('user-a', {
      $dateFrom: '2026-10-01',
      $dateTo: '2026-10-31',
      $includePaused: 'true',
    });
    expect(a).toEqual(b);
    expect(a).toMatchObject({status: 200, data: [], totalCount: 0});
  });
  it('preserves list filters and not-found metadata', async () => {
    expect(
      await listRecurringPayments('user-a', {
        $paused: false,
        $categories: categoryId,
        $excl_categories: categoryId,
        $paymentMethods: paymentMethodId,
        $excl_paymentMethods: paymentMethodId,
      }),
    ).toMatchObject({status: 200, data: [], totalCount: 0});
    expect(await getRecurringPayment('user-a', id)).toMatchObject({status: 404, from: 'db'});
    mocks.recurringFindFirst.mockResolvedValue({id, ...recurring});
    expect(await getRecurringPayment('user-a', id)).toMatchObject({status: 200, data: {id}});
  });
  it('invalidates successful writes and never accepts foreign references', async () => {
    expect((await createRecurringPayment('user-a', recurring)).status).toBe(200);
    expect((await updateRecurringPayment('user-a', id, {receiver: 'New'})).status).toBe(200);
    expect((await removeRecurringPayment('user-a', id)).status).toBe(200);
    expect(mocks.invalidate.mock.calls).toEqual(Array.from({length: 3}, () => ['user-a', '/api/recurringPayment']));
    mocks.invalidate.mockClear();
    mocks.paymentMethodFindMany.mockResolvedValue([]);
    expect((await createRecurringPayment('user-a', recurring)).status).toBe(400);
    expect((await updateRecurringPayment('user-a', id, {paymentMethodId})).status).toBe(400);
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it('maps empty write results to errors without invalidation', async () => {
    mocks.returning.mockResolvedValue([]);
    expect((await createRecurringPayment('user-a', recurring)).status).toBe(500);
    expect((await updateRecurringPayment('user-a', id, {})).status).toBe(404);
    expect((await removeRecurringPayment('user-a', id)).status).toBe(404);
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});

describe('shared attachment retrieval', () => {
  it('hides missing and foreign attachments before signing', async () => {
    expect(await getAttachment('user-a', id)).toMatchObject({status: 404, message: 'Attachment not found'});
    expect(mocks.verifyOwnership).toHaveBeenCalledWith(id, 'user-a');
    expect(mocks.generateSignedUrl).not.toHaveBeenCalled();
  });
  it('returns signed metadata with ISO dates and requested TTL', async () => {
    const record = {
      id,
      ownerId: 'user-a',
      fileName: 'receipt',
      fileExtension: 'pdf',
      contentType: 'application/pdf',
      location: 'receipts/a',
      createdAt: new Date('2026-10-05T12:00:00Z'),
    };
    mocks.verifyOwnership.mockResolvedValue(record);
    expect(await getAttachment('user-a', id, {ttl: 120})).toMatchObject({
      status: 200,
      data: {...record, createdAt: '2026-10-05T12:00:00.000Z', signedUrl: 'https://signed.example/file'},
    });
    expect(mocks.generateSignedUrl).toHaveBeenCalledWith(record, {ttl: 120});
  });
  it('validates TTL before accessing storage and maps signing failures', async () => {
    await expect(getAttachment('user-a', id, {ttl: 1})).rejects.toThrow();
    mocks.verifyOwnership.mockRejectedValue(new Error('storage offline'));
    expect(await getAttachment('user-a', id)).toMatchObject({status: 500, message: 'Failed to retrieve attachment'});
  });
});
