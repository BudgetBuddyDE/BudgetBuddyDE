import {beforeEach, describe, expect, it, suite, vi} from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks – must be declared before the module under test is imported.
// Variables used inside vi.mock factories must be hoisted via vi.hoisted().
// ---------------------------------------------------------------------------

const {
  mockS3Send,
  mockDbInsert,
  mockDbSelect,
  mockDbDelete,
  mockDbTransaction,
  mockDbQuery,
  mockRedisGet,
  mockRedisSet,
  mockRedisDel,
  mockGetSignedUrl,
} = vi.hoisted(() => ({
  mockS3Send: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbDelete: vi.fn(),
  mockDbTransaction: vi.fn(),
  mockDbQuery: {
    attachments: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
  mockRedisGet: vi.fn(),
  mockRedisSet: vi.fn(),
  mockRedisDel: vi.fn(),
  mockGetSignedUrl: vi.fn(),
}));

// Mock @budgetbuddyde/db/backend to prevent drizzle-zod schema generation at import time
vi.mock('@budgetbuddyde/db/backend', () => ({
  attachments: {
    id: {},
    ownerId: {},
    fileName: {},
    fileExtension: {},
    contentType: {},
    location: {},
    fileSize: {},
    createdAt: {},
  },
  transactionAttachments: {transactionId: {}, attachmentId: {}},
}));

vi.mock('../lib/s3', () => ({
  getS3Client: () => ({send: mockS3Send}),
}));

vi.mock('../db', () => ({
  db: {
    insert: (...args: unknown[]) => mockDbInsert(...args),
    select: (...args: unknown[]) => mockDbSelect(...args),
    delete: (...args: unknown[]) => mockDbDelete(...args),
    transaction: (...args: unknown[]) => mockDbTransaction(...args),
    query: mockDbQuery,
  },
}));

vi.mock('../db/redis', () => ({
  getRedisClient: () => ({
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
    status: 'ready',
  }),
}));

vi.mock('../lib/logger', () => ({
  logger: {
    child: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

import {AttachmentHandler} from '../lib/attachment/attachment.handler';
import {TransactionAttachmentHandler} from '../lib/attachment/transaction-attachment.handler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMulFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'files',
    originalname: 'test.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: Buffer.from('fake-image-data'),
    size: 16,
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

const BUCKET = 'test-bucket';
const USER_ID = 'user-123';
const TX_ID = 'tx-456';
const ATTACHMENT_ID = '01926a0b-0000-7000-8000-000000000001';

// ---------------------------------------------------------------------------
// AttachmentHandler – static helper
// ---------------------------------------------------------------------------

suite('AttachmentHandler', () => {
  describe('getFileExtension', () => {
    it('returns lowercase extension without leading dot', () => {
      const file = makeMulFile({originalname: 'photo.PNG'});
      expect(AttachmentHandler.getFileExtension(file)).toBe('png');
    });

    it('handles files without extension', () => {
      const file = makeMulFile({originalname: 'noext'});
      expect(AttachmentHandler.getFileExtension(file)).toBe('');
    });

    it('handles dotfiles', () => {
      const file = makeMulFile({originalname: '.gitignore'});
      // Node.js path.extname('.gitignore') returns '' — dotfiles have no extension
      expect(AttachmentHandler.getFileExtension(file)).toBe('');
    });
  });
});

// ---------------------------------------------------------------------------
// AttachmentHandler – generateSignedUrl
// ---------------------------------------------------------------------------

suite('AttachmentHandler.generateSignedUrl', () => {
  let handler: TransactionAttachmentHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new TransactionAttachmentHandler(BUCKET);
  });

  it('returns cached URL when present in cache', async () => {
    mockRedisGet.mockResolvedValueOnce('https://s3.example.com/signed?cached');

    const record = {
      id: ATTACHMENT_ID,
      location: `transactions/${USER_ID}/${TX_ID}/${ATTACHMENT_ID}.png`,
      ownerId: USER_ID,
      fileName: 'test.png',
      fileExtension: 'png',
      contentType: 'image/png',
      createdAt: new Date(),
    };

    const url = await handler.generateSignedUrl(record);
    expect(url).toBe('https://s3.example.com/signed?cached');
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it('generates and caches a signed URL on cache miss', async () => {
    mockRedisGet.mockResolvedValueOnce(null);
    mockGetSignedUrl.mockResolvedValueOnce('https://s3.example.com/signed?fresh');
    mockRedisSet.mockResolvedValueOnce('OK');

    const record = {
      id: ATTACHMENT_ID,
      location: `transactions/${USER_ID}/${TX_ID}/${ATTACHMENT_ID}.png`,
      ownerId: USER_ID,
      fileName: 'test.png',
      fileExtension: 'png',
      contentType: 'image/png',
      createdAt: new Date(),
    };

    const url = await handler.generateSignedUrl(record, {ttl: 300});
    expect(url).toBe('https://s3.example.com/signed?fresh');
    expect(mockGetSignedUrl).toHaveBeenCalledOnce();
    expect(mockRedisSet).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// AttachmentHandler – generateSignedUrls
// ---------------------------------------------------------------------------

suite('AttachmentHandler.generateSignedUrls', () => {
  let handler: TransactionAttachmentHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new TransactionAttachmentHandler(BUCKET);
  });

  it('returns empty map for empty input', async () => {
    const result = await handler.generateSignedUrls([]);
    expect(result.signedUrls.size).toBe(0);
    expect(result.source).toBeUndefined();
  });

  it('serves all from cache when all URLs are cached', async () => {
    mockRedisGet.mockResolvedValue('https://cached.example.com/url');

    const attachmentList = [
      {attachmentId: 'id-1' as never, objectStoreLocation: 'path/1'},
      {attachmentId: 'id-2' as never, objectStoreLocation: 'path/2'},
    ];

    const {signedUrls, source} = await handler.generateSignedUrls(attachmentList);
    expect(signedUrls.size).toBe(2);
    expect(source).toBe('cache');
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it('generates signed URLs for cache misses', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockGetSignedUrl.mockResolvedValue('https://fresh.example.com/url');
    mockRedisSet.mockResolvedValue('OK');

    const attachmentList = [{attachmentId: 'id-1' as never, objectStoreLocation: 'path/1'}];

    const {signedUrls, source} = await handler.generateSignedUrls(attachmentList);
    expect(signedUrls.size).toBe(1);
    expect(source).toBe('object_store');
    expect(mockGetSignedUrl).toHaveBeenCalledOnce();
  });

  it('returns undefined source when mix of cached and fresh', async () => {
    mockRedisGet
      .mockResolvedValueOnce('https://cached.example.com/url') // first from cache
      .mockResolvedValueOnce(null); // second not cached
    mockGetSignedUrl.mockResolvedValue('https://fresh.example.com/url');
    mockRedisSet.mockResolvedValue('OK');

    const attachmentList = [
      {attachmentId: 'id-1' as never, objectStoreLocation: 'path/1'},
      {attachmentId: 'id-2' as never, objectStoreLocation: 'path/2'},
    ];

    const {source} = await handler.generateSignedUrls(attachmentList);
    expect(source).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AttachmentHandler – deleteAttachments
// ---------------------------------------------------------------------------

suite('AttachmentHandler.deleteAttachments', () => {
  let handler: TransactionAttachmentHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new TransactionAttachmentHandler(BUCKET);
  });

  it('returns 0 when no attachments belong to user', async () => {
    mockDbQuery.attachments.findMany.mockResolvedValueOnce([]);

    const count = await handler.deleteAttachments(USER_ID, ['id-1', 'id-2']);
    expect(count).toBe(0);
    expect(mockS3Send).not.toHaveBeenCalled();
  });

  it('deletes from S3, DB, and cache when attachments exist', async () => {
    const target = {id: 'id-1', location: 'path/to/file.png'};
    mockDbQuery.attachments.findMany.mockResolvedValueOnce([target]);
    mockS3Send.mockResolvedValueOnce({});

    const mockDeleteWhere = vi.fn().mockResolvedValueOnce([]);
    mockDbDelete.mockReturnValueOnce({where: mockDeleteWhere});
    mockRedisDel.mockResolvedValueOnce(1);

    const count = await handler.deleteAttachments(USER_ID, ['id-1']);
    expect(count).toBe(1);
    expect(mockS3Send).toHaveBeenCalledOnce();
    expect(mockDbDelete).toHaveBeenCalledOnce();
    expect(mockRedisDel).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// TransactionAttachmentHandler – uploadTransactionAttachments
// ---------------------------------------------------------------------------

suite('TransactionAttachmentHandler.uploadTransactionAttachments', () => {
  let handler: TransactionAttachmentHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new TransactionAttachmentHandler(BUCKET);
  });

  it('inserts DB records, uploads to S3, and returns signed URLs', async () => {
    // Mock the DB transaction
    mockDbTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<void>) => {
      const mockTx = {
        insert: vi.fn().mockReturnValue({values: vi.fn().mockResolvedValue([])}),
      };
      await callback(mockTx);
    });

    mockS3Send.mockResolvedValue({});
    mockRedisGet.mockResolvedValue(null);
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/new');
    mockRedisSet.mockResolvedValue('OK');

    const file = makeMulFile();
    const results = await handler.uploadTransactionAttachments(USER_ID, TX_ID, [file]);

    expect(results).toHaveLength(1);
    expect(results[0].ownerId).toBe(USER_ID);
    expect(results[0].fileName).toBe('test.png');
    expect(results[0].fileExtension).toBe('png');
    expect(results[0].contentType).toBe('image/png');
    expect(results[0].signedUrl).toBe('https://signed.example.com/new');
    expect(mockS3Send).toHaveBeenCalledOnce();
  });

  it('generates correct S3 storage path', async () => {
    mockDbTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<void>) => {
      const mockTx = {
        insert: vi.fn().mockReturnValue({values: vi.fn().mockResolvedValue([])}),
      };
      await callback(mockTx);
    });

    mockS3Send.mockResolvedValue({});
    mockRedisGet.mockResolvedValue(null);
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/path');
    mockRedisSet.mockResolvedValue('OK');

    const file = makeMulFile({originalname: 'receipt.jpg', mimetype: 'image/jpg'});
    const results = await handler.uploadTransactionAttachments(USER_ID, TX_ID, [file]);

    expect(results[0].location).toMatch(new RegExp(`^${USER_ID}/transactions/${TX_ID}/[0-9a-f-]+\\.jpg$`));
  });
});

// ---------------------------------------------------------------------------
// TransactionAttachmentHandler – findTransactionAttachmentsByOwner
// ---------------------------------------------------------------------------

suite('TransactionAttachmentHandler.findTransactionAttachmentsByOwner', () => {
  let handler: TransactionAttachmentHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new TransactionAttachmentHandler(BUCKET);
  });

  it('returns empty result when no attachments exist', async () => {
    // Mock chained select call for count
    const mockCountChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{count: 0}]),
    };
    // Mock chained select call for sum (attachmentsSize)
    const mockSumChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{totalSize: '0'}]),
    };
    // Mock chained select call for records
    const mockRecordsChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    mockDbSelect
      .mockReturnValueOnce(mockCountChain)
      .mockReturnValueOnce(mockSumChain)
      .mockReturnValueOnce(mockRecordsChain);

    const result = await handler.findTransactionAttachmentsByOwner(USER_ID);
    expect(result.attachments).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it('returns attachments with signed URLs when records exist', async () => {
    const record = {
      id: ATTACHMENT_ID,
      ownerId: USER_ID,
      fileName: 'invoice.png',
      fileExtension: 'png',
      contentType: 'image/png',
      location: `transactions/${USER_ID}/${TX_ID}/${ATTACHMENT_ID}.png`,
      fileSize: 12345,
      createdAt: new Date(),
    };

    const mockCountChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{count: 1}]),
    };
    const mockSumChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{totalSize: '12345'}]),
    };
    const mockRecordsChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([record]),
    };
    mockDbSelect
      .mockReturnValueOnce(mockCountChain)
      .mockReturnValueOnce(mockSumChain)
      .mockReturnValueOnce(mockRecordsChain);

    mockRedisGet.mockResolvedValue(null);
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/invoice');
    mockRedisSet.mockResolvedValue('OK');

    const result = await handler.findTransactionAttachmentsByOwner(USER_ID);
    expect(result.totalCount).toBe(1);
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].signedUrl).toBe('https://signed.example.com/invoice');
    expect(result.attachmentsSize).toBe(12345);
  });
});

// ---------------------------------------------------------------------------
// TransactionAttachmentHandler – deleteTransactionAttachments
// ---------------------------------------------------------------------------

suite('TransactionAttachmentHandler.deleteTransactionAttachments', () => {
  let handler: TransactionAttachmentHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new TransactionAttachmentHandler(BUCKET);
  });

  it('returns 0 when no attachments found for transaction', async () => {
    const mockChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    mockDbSelect.mockReturnValueOnce(mockChain);

    const count = await handler.deleteTransactionAttachments(USER_ID, TX_ID);
    expect(count).toBe(0);
  });

  it('deletes attachments for the transaction', async () => {
    const target = {id: ATTACHMENT_ID, location: `transactions/${USER_ID}/${TX_ID}/${ATTACHMENT_ID}.png`};

    const mockSelectChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([target]),
    };
    mockDbSelect.mockReturnValueOnce(mockSelectChain);

    // Mock findByOwnerAndIds used inside deleteAttachments
    mockDbQuery.attachments.findMany.mockResolvedValueOnce([target]);
    mockS3Send.mockResolvedValueOnce({});
    const mockDeleteWhere = vi.fn().mockResolvedValueOnce([]);
    mockDbDelete.mockReturnValueOnce({where: mockDeleteWhere});
    mockRedisDel.mockResolvedValueOnce(1);

    const count = await handler.deleteTransactionAttachments(USER_ID, TX_ID);
    expect(count).toBe(1);
  });
});
