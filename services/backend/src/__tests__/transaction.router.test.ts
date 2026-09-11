import {beforeEach, describe, expect, it, vi} from 'vitest';
import {requestRouter} from './router.test-utils';
import {transactionRouter} from '../router/transaction.router';

const {categoryFindMany, paymentMethodFindMany, insert, update, returning, attachmentLogger} = vi.hoisted(() => ({
  categoryFindMany: vi.fn(),
  paymentMethodFindMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  returning: vi.fn(),
  attachmentLogger: {debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn()},
}));

vi.mock('../db', () => ({
  db: {
    query: {
      categories: {findMany: categoryFindMany},
      paymentMethods: {findMany: paymentMethodFindMany},
      transactions: {findMany: vi.fn(), findFirst: vi.fn()},
    },
    insert,
    update,
  },
}));

vi.mock('../config', () => ({
  config: {
    timezone: 'Europe/Berlin',
    attachments: {
      allowedContentTypes: new Set(['image/png']),
      octetStreamAllowedExtensions: new Set(['heic']),
      mimeTypeOverrides: {},
      transactionPreviewLimit: 3,
      upload: {maxFilesPerRequest: 10, maxFileSizeBytes: 20 * 1024 * 1024},
      signedUrlTtlSeconds: 900,
    },
    getRequiredObjectStorageConfig: vi.fn(() => ({bucketName: 'test-bucket'})),
  },
}));

vi.mock('../lib', () => ({logger: {...attachmentLogger, child: vi.fn(() => attachmentLogger)}}));
vi.mock('../lib/attachment', () => ({
  TransactionAttachmentHandler: vi.fn(() => ({
    generateSignedUrls: vi.fn().mockResolvedValue({signedUrls: new Map()}),
    uploadTransactionAttachments: vi.fn(),
  })),
}));

const USER_ID = 'user-1';
const CATEGORY_ID = '00000000-0000-4000-8000-000000000001';
const PAYMENT_METHOD_ID = '00000000-0000-4000-8000-000000000002';
const TRANSACTION_ID = '00000000-0000-4000-8000-000000000003';

const transactionBody = {
  categoryId: CATEGORY_ID,
  paymentMethodId: PAYMENT_METHOD_ID,
  processedAt: '2026-08-28T12:00:00.000Z',
  receiver: 'Test receiver',
  transferAmount: -12.5,
  information: null,
};

describe('single transaction writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryFindMany.mockResolvedValue([{id: CATEGORY_ID}]);
    paymentMethodFindMany.mockResolvedValue([{id: PAYMENT_METHOD_ID}]);
    returning.mockResolvedValue([{id: TRANSACTION_ID, ...transactionBody, ownerId: USER_ID}]);
    insert.mockReturnValue({values: vi.fn().mockReturnValue({returning})});
    update.mockReturnValue({set: vi.fn().mockReturnValue({where: vi.fn().mockReturnValue({returning})})});
  });

  it('rejects create when the category is not owned by the user', async () => {
    categoryFindMany.mockResolvedValueOnce([]);

    const response = await requestRouter(transactionRouter, USER_ID, '/', {method: 'POST', body: transactionBody});

    expect(response.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects create when the payment method is not owned by the user', async () => {
    paymentMethodFindMany.mockResolvedValueOnce([]);

    const response = await requestRouter(transactionRouter, USER_ID, '/', {method: 'POST', body: transactionBody});

    expect(response.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it('persists a create with the authenticated owner after validating both references', async () => {
    const response = await requestRouter(transactionRouter, USER_ID, '/', {
      method: 'POST',
      body: {...transactionBody, ownerId: 'another-user'},
    });

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledOnce();
    expect(insert.mock.results[0].value.values).toHaveBeenCalledWith([
      expect.objectContaining({ownerId: USER_ID, categoryId: CATEGORY_ID, paymentMethodId: PAYMENT_METHOD_ID}),
    ]);
  });

  it('rejects update when a changed category is not owned by the user', async () => {
    categoryFindMany.mockResolvedValueOnce([]);

    const response = await requestRouter(transactionRouter, USER_ID, `/${TRANSACTION_ID}`, {
      method: 'PUT',
      body: {...transactionBody, categoryId: '00000000-0000-4000-8000-000000000004'},
    });

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects update when a changed payment method is not owned by the user', async () => {
    paymentMethodFindMany.mockResolvedValueOnce([]);

    const response = await requestRouter(transactionRouter, USER_ID, `/${TRANSACTION_ID}`, {
      method: 'PUT',
      body: {...transactionBody, paymentMethodId: '00000000-0000-4000-8000-000000000005'},
    });

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('persists an update with the authenticated owner after validating changed references', async () => {
    const response = await requestRouter(transactionRouter, USER_ID, `/${TRANSACTION_ID}`, {
      method: 'PUT',
      body: {...transactionBody, ownerId: 'another-user'},
    });

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledOnce();
    expect(update.mock.results[0].value.set).toHaveBeenCalledWith(expect.objectContaining({ownerId: USER_ID}));
  });
});
