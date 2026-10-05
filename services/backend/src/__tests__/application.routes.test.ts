import type {AddressInfo} from 'node:net';
import {PgDialect} from 'drizzle-orm/pg-core';
import express from 'express';
import {handleError} from '../middleware/handleError.middleware';
import {applicationRouter} from '../router/application.router';

const mocks = vi.hoisted(() => ({
  find: {
    categories: vi.fn(),
    paymentMethods: vi.fn(),
    transactions: vi.fn(),
    recurringPayments: vi.fn(),
    budgets: vi.fn(),
  },
  attachmentRows: vi.fn(),
  where: vi.fn(),
  send: vi.fn(),
  importArchive: vi.fn(),
  invalidate: vi.fn(),
  formatError: class extends Error {},
  config: {
    exportRateLimit: {enabled: false, keyPrefix: 'application-export', options: {limit: 4}},
    export: {maxBytes: 104857600, attachmentConcurrency: 2},
    getRequiredObjectStorageConfig: () => ({bucketName: 'attachments'}),
  },
}));
vi.mock('../config', () => ({config: mocks.config}));
vi.mock('../db', () => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: mocks.where,
    orderBy: mocks.attachmentRows,
  };
  mocks.where.mockReturnValue(chain);
  return {
    db: {
      query: Object.fromEntries(Object.entries(mocks.find).map(([name, fn]) => [name, {findMany: fn}])),
      select: vi.fn(() => chain),
    },
  };
});
vi.mock('../lib/logger', () => {
  const logger = {error: vi.fn(), child: vi.fn()};
  logger.child.mockReturnValue(logger);
  return {logger};
});
vi.mock('../lib/s3', () => ({getS3Client: () => ({send: mocks.send})}));
vi.mock('../middleware/cache.middleware', () => ({invalidateUserCaches: mocks.invalidate}));
vi.mock('../router/applicationImport', async importOriginal => {
  const actual = await importOriginal<typeof import('../router/applicationImport')>();
  return {...actual, importApplicationArchive: mocks.importArchive, ApplicationImportFormatError: mocks.formatError};
});

function readZipEntries(archive: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let offset = 0;
  while (archive.readUInt32LE(offset) === 0x04034b50) {
    const size = archive.readUInt32LE(offset + 18);
    const nameLength = archive.readUInt16LE(offset + 26);
    const extraLength = archive.readUInt16LE(offset + 28);
    const name = archive.subarray(offset + 30, offset + 30 + nameLength).toString();
    const start = offset + 30 + nameLength + extraLength;
    files.set(name, archive.subarray(start, start + size));
    offset = start + size;
  }
  return files;
}

const OWNER = 'owner';
async function request(path: string, body?: FormData, userId: string | null = OWNER) {
  const app = express();
  app.use((req, _res, next) => {
    req.context = {user: userId ? ({id: userId} as never) : null, session: null};
    next();
  });
  app.use(applicationRouter);
  app.use(handleError);
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`, {
      method: body ? 'POST' : 'GET',
      body,
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    return {status: response.status, headers: response.headers, bytes, json: () => JSON.parse(bytes.toString())};
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}
function upload(mode = 'preview', includeFile = true) {
  const form = new FormData();
  form.set('mode', mode);
  if (includeFile) form.set('archive', new Blob(['archive']), 'data.zip');
  return form;
}
beforeEach(() => {
  Object.values(mocks.find).forEach(fn => fn.mockReset().mockResolvedValue([]));
  mocks.attachmentRows.mockReset().mockResolvedValue([]);
  mocks.send.mockReset().mockResolvedValue({Body: Buffer.from('receipt')});
  mocks.importArchive.mockReset().mockResolvedValue({summary: {created: 1}});
  mocks.invalidate.mockReset().mockResolvedValue(undefined);
  mocks.where.mockClear();
  mocks.config.export.maxBytes = 104857600;
});

describe('application imports', () => {
  it('requires authentication and an archive', async () => {
    expect((await request('/import', upload(), null)).status).toBe(401);
    expect((await request('/import', upload('preview', false))).status).toBe(400);
    expect(mocks.importArchive).not.toHaveBeenCalled();
  });
  it('rejects an unknown import mode before persistence', async () => {
    expect((await request('/import', upload('overwrite'))).status).toBe(400);
    expect(mocks.importArchive).not.toHaveBeenCalled();
  });
  it.each(['preview', 'commit'])('passes archive and authenticated owner to %s', async mode => {
    const result = await request('/import', upload(mode));
    expect(result.status).toBe(200);
    expect(mocks.importArchive).toHaveBeenCalledWith(Buffer.from('archive'), OWNER, mode);
    expect(mocks.invalidate).toHaveBeenCalledTimes(mode === 'commit' ? 1 : 0);
    expect(result.json()).toMatchObject({data: {summary: {created: 1}}});
  });
  it('does not invalidate caches for a commit with no created records', async () => {
    mocks.importArchive.mockResolvedValue({summary: {created: 0}});
    expect((await request('/import', upload('commit'))).status).toBe(200);
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it('reports malformed archives and masks database failures', async () => {
    mocks.importArchive.mockRejectedValueOnce(new mocks.formatError('Invalid ZIP archive'));
    expect((await request('/import', upload())).status).toBe(400);
    mocks.importArchive.mockRejectedValueOnce(new Error('private database detail'));
    const result = await request('/import', upload('commit'));
    expect(result.status).toBe(500);
    expect(result.json().message).toBe('The import could not be completed');
    mocks.importArchive.mockRejectedValueOnce('private detail');
    expect((await request('/import', upload())).status).toBe(500);
  });
});

describe('application exports', () => {
  it('rejects anonymous downloads and invalid queries', async () => {
    expect((await request('/export?format=json&resources=categories', undefined, null)).status).toBe(401);
    expect((await request('/export?format=xml')).status).toBe(400);
    expect(mocks.find.categories).not.toHaveBeenCalled();
  });
  it('exports selected resources only with owner filters and no-store download headers', async () => {
    mocks.find.categories.mockResolvedValue([{id: 'category', ownerId: OWNER, name: 'Rent'}]);
    const result = await request('/export?format=json&resources=categories');
    expect(result.status).toBe(200);
    expect(result.headers.get('content-type')).toBe('application/zip');
    expect(result.headers.get('cache-control')).toBe('no-store, private');
    expect(result.headers.get('content-disposition')).toContain('budgetbuddy-application-export-');
    const sql = new PgDialect().sqlToQuery(mocks.find.categories.mock.lastCall![0].where);
    expect(sql.params).toEqual([OWNER]);
    expect(mocks.find.paymentMethods).not.toHaveBeenCalled();
    const files = await readZipEntries(result.bytes);
    expect(JSON.parse(files.get('categories.json')!.toString())).toEqual([
      {id: 'category', ownerId: OWNER, name: 'Rent'},
    ]);
    expect(files.has('transactions.json')).toBe(false);
  });
  it('includes every requested resource and translates budget associations', async () => {
    mocks.find.budgets.mockResolvedValue([{id: 'budget', ownerId: OWNER, categories: [{categoryId: 'category'}]}]);
    const result = await request(
      '/export?format=csv&resources=categories&resources=payment-methods&resources=transactions&resources=recurring-payments&resources=budgets&resources=attachments',
    );
    expect(result.status).toBe(200);
    Object.values(mocks.find).forEach(fn => expect(fn).toHaveBeenCalledOnce());
    const files = await readZipEntries(result.bytes);
    expect(files.get('budgets.csv')!.toString()).toContain('category');
    expect(JSON.parse(files.get('manifest.json')!.toString()).attachmentsIncluded).toBe(true);
  });
  it('groups shared attachments, excludes storage keys and downloads each object once', async () => {
    const base = {
      id: 'attachment',
      ownerId: OWNER,
      fileName: 'receipt.pdf',
      fileExtension: 'pdf',
      contentType: 'application/pdf',
      location: 'private/storage-key',
      createdAt: new Date('2026-01-01'),
    };
    mocks.attachmentRows.mockResolvedValue([
      {...base, transactionId: 'first'},
      {...base, transactionId: 'second'},
      {...base, transactionId: null},
      {...base, id: 'unassigned', transactionId: null},
    ]);
    const result = await request('/export?format=json&resources=attachments');
    expect(result.status).toBe(200);
    const files = await readZipEntries(result.bytes);
    const rows = JSON.parse(files.get('attachments.json')!.toString());
    expect(rows[0].transactionIds).toEqual(['first', 'second']);
    expect(rows[1].transactionIds).toEqual([]);
    expect(rows[0]).not.toHaveProperty('location');
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.send.mock.calls[0][0].input).toEqual({Bucket: 'attachments', Key: 'private/storage-key'});
    expect(new PgDialect().sqlToQuery(mocks.where.mock.lastCall![0]).params).toEqual([OWNER]);
  });
  it('rejects oversized metadata before reading any object', async () => {
    mocks.config.export.maxBytes = 1;
    expect((await request('/export?format=json&resources=categories')).status).toBe(413);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('rejects oversized attachment content and masks storage failures', async () => {
    mocks.attachmentRows.mockResolvedValue([
      {
        id: 'attachment',
        ownerId: OWNER,
        fileName: 'receipt.pdf',
        fileExtension: 'pdf',
        contentType: 'application/pdf',
        location: 'key',
        createdAt: new Date(),
        transactionId: null,
      },
    ]);
    mocks.config.export.maxBytes = 1000;
    mocks.send.mockResolvedValueOnce({Body: Buffer.alloc(1001)});
    expect((await request('/export?format=json&resources=attachments')).status).toBe(413);
    mocks.config.export.maxBytes = 104857600;
    mocks.send.mockRejectedValueOnce(new Error('private bucket detail'));
    const result = await request('/export?format=json&resources=attachments');
    expect(result.status).toBe(500);
    expect(result.json().message).toBe('Unable to export attachments');
  });
  it('maps database failures to safe responses', async () => {
    mocks.find.categories.mockRejectedValueOnce(new Error('private query detail'));
    const result = await request('/export?format=json&resources=categories');
    expect(result.status).toBe(500);
    expect(result.json().message).toBe('Internal Server Error');
  });
});
