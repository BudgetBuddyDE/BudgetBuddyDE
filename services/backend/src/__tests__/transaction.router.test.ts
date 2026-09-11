import {PgDialect} from 'drizzle-orm/pg-core';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {requestRouter} from './router.test-utils';
import {transactionRouter} from '../router/transaction.router';

const {
  attachmentLogger,
  categoryFindMany,
  insert,
  paymentMethodFindMany,
  select,
  transactionFindFirst,
  transactionFindMany,
  uploadTransactionAttachments,
  update,
  returning,
} = vi.hoisted(() => ({
  categoryFindMany: vi.fn(),
  paymentMethodFindMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  returning: vi.fn(),
  select: vi.fn(),
  transactionFindFirst: vi.fn(),
  transactionFindMany: vi.fn(),
  uploadTransactionAttachments: vi.fn(),
  attachmentLogger: {debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn()},
}));

vi.mock('../db', () => ({
  db: {
    query: {
      categories: {findMany: categoryFindMany},
      paymentMethods: {findMany: paymentMethodFindMany},
      transactions: {findMany: transactionFindMany, findFirst: transactionFindFirst},
    },
    insert,
    select,
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
    uploadTransactionAttachments,
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
    transactionFindFirst.mockResolvedValue(undefined);
    transactionFindMany.mockResolvedValue([]);
    uploadTransactionAttachments.mockResolvedValue([]);
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

describe('transaction attachment isolation', () => {
  it('rejects an attachment upload for a transaction not owned by the user', async () => {
    const form = new FormData();
    form.append('files', new Blob([Buffer.from('file')], {type: 'image/png'}), 'receipt.png');

    const response = await requestRouter(transactionRouter, USER_ID, `/${TRANSACTION_ID}/attachments`, {
      method: 'POST',
      body: form,
    });

    expect(response.status).toBe(404);
    expect(uploadTransactionAttachments).not.toHaveBeenCalled();
  });

  it('uploads attachments for an owned transaction', async () => {
    transactionFindFirst.mockResolvedValueOnce({id: TRANSACTION_ID});
    const form = new FormData();
    form.append('files', new Blob([Buffer.from('file')], {type: 'image/png'}), 'receipt.png');

    const response = await requestRouter(transactionRouter, USER_ID, `/${TRANSACTION_ID}/attachments`, {
      method: 'POST',
      body: form,
    });

    expect(response.status).toBe(201);
    expect(uploadTransactionAttachments).toHaveBeenCalledWith(USER_ID, TRANSACTION_ID, [expect.anything()]);
  });

  it('filters transaction previews by attachment owner', async () => {
    transactionFindMany.mockResolvedValueOnce([
      {
        id: TRANSACTION_ID,
        category: null,
        paymentMethod: null,
      },
    ]);
    const countChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{count: 1}]),
    };
    const previewWhere = vi.fn().mockReturnThis();
    const previewChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: previewWhere,
      orderBy: vi.fn().mockResolvedValue([]),
    };
    select.mockReturnValueOnce(countChain).mockReturnValueOnce(previewChain);

    const response = await requestRouter(transactionRouter, USER_ID, '/', {method: 'GET'});

    expect(response.status).toBe(200);
    const query = new PgDialect().sqlToQuery(previewWhere.mock.calls[0][0].getSQL());
    expect(query.sql).toContain('owner_id');
    expect(query.params).toContain(USER_ID);
    expect(query.sql).toContain('transaction_id');
    expect(response.body).toMatchObject({data: [{attachments: [], attachmentCount: 0}]});
  });
});
