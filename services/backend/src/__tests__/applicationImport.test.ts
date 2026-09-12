import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createZipArchive} from '../router/applicationExport';
import {
  ApplicationImportFormatError,
  importApplicationArchive,
  parseApplicationImportArchive,
} from '../router/applicationImport';

const {transaction} = vi.hoisted(() => ({transaction: vi.fn()}));

vi.mock('../db', () => ({
  db: {
    query: {
      categories: {findMany: vi.fn().mockResolvedValue([])},
      paymentMethods: {findMany: vi.fn().mockResolvedValue([])},
      transactions: {findMany: vi.fn().mockResolvedValue([])},
      recurringPayments: {findMany: vi.fn().mockResolvedValue([])},
      budgets: {findMany: vi.fn().mockResolvedValue([])},
    },
    transaction,
  },
}));

function categoriesArchive(categories: Array<{id: string; name: string; description: null}>) {
  return createZipArchive([
    {name: 'categories.json', content: Buffer.from(JSON.stringify(categories))},
    {
      name: 'manifest.json',
      content: Buffer.from(
        JSON.stringify({
          archiveFormat: 'zip',
          attachmentsIncluded: false,
          format: 'json',
          resources: [{file: 'categories.json', resource: 'categories', rowCount: categories.length}],
          schemaVersion: 1,
        }),
      ),
    },
  ]);
}

describe('application import archive parsing', () => {
  it('reads the JSON archive format emitted by application export', () => {
    const archive = createZipArchive([
      {
        name: 'categories.json',
        content: Buffer.from('[{"id":"0199d24e-aa34-7f5a-8a9f-5c1bcd4b9e53","name":"Food","description":null}]\n'),
      },
      {
        name: 'manifest.json',
        content: Buffer.from(
          JSON.stringify({
            archiveFormat: 'zip',
            attachmentsIncluded: false,
            format: 'json',
            resources: [{file: 'categories.json', resource: 'categories', rowCount: 1}],
            schemaVersion: 1,
          }),
        ),
      },
    ]);

    expect(parseApplicationImportArchive(archive)).toEqual({
      categories: [
        {
          row: 1,
          value: {id: '0199d24e-aa34-7f5a-8a9f-5c1bcd4b9e53', name: 'Food', description: null},
        },
      ],
    });
  });

  it('rejects archive entries that are not declared by the manifest', () => {
    const archive = createZipArchive([
      {name: 'unexpected.json', content: Buffer.from('[]')},
      {
        name: 'manifest.json',
        content: Buffer.from(
          JSON.stringify({
            archiveFormat: 'zip',
            attachmentsIncluded: false,
            format: 'json',
            resources: [],
            schemaVersion: 1,
          }),
        ),
      },
    ]);

    expect(() => parseApplicationImportArchive(archive)).toThrow('unexpected files');
  });

  it('restores CSV values escaped by the exporter', () => {
    const archive = createZipArchive([
      {
        name: 'categories.csv',
        content: Buffer.from('"id","ownerId","name","description"\r\n"id-1","owner","\'=SUM(A1:A2)",""\r\n'),
      },
      {
        name: 'manifest.json',
        content: Buffer.from(
          JSON.stringify({
            archiveFormat: 'zip',
            attachmentsIncluded: false,
            format: 'csv',
            resources: [{file: 'categories.csv', resource: 'categories', rowCount: 1}],
            schemaVersion: 1,
          }),
        ),
      },
    ]);

    expect(parseApplicationImportArchive(archive).categories?.[0]?.value).toMatchObject({
      description: null,
      name: '=SUM(A1:A2)',
    });
  });
});

describe('application import commit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists commit-mode imports in a single transaction', async () => {
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const txInsert = vi.fn().mockReturnValue({values: insertValues});
    transaction.mockImplementation(async (callback: (tx: {insert: typeof txInsert}) => Promise<unknown>) =>
      callback({insert: txInsert}),
    );

    const result = await importApplicationArchive(
      categoriesArchive([{id: '0199d24e-aa34-7f5a-8a9f-5c1bcd4b9e53', name: 'Food', description: null}]),
      'user-1',
      'commit',
    );

    expect(transaction).toHaveBeenCalledOnce();
    expect(txInsert).toHaveBeenCalledOnce();
    expect(result.summary.created).toBe(1);
  });

  it('propagates a write failure so the transaction rolls back', async () => {
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({insert: () => ({values: vi.fn().mockRejectedValue(new Error('write failed'))})}),
    );

    await expect(
      importApplicationArchive(
        categoriesArchive([{id: '0199d24e-aa34-7f5a-8a9f-5c1bcd4b9e53', name: 'Food', description: null}]),
        'user-1',
        'commit',
      ),
    ).rejects.toThrow('write failed');
  });

  it('chunks large resource inserts', async () => {
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const txInsert = vi.fn().mockReturnValue({values: insertValues});
    transaction.mockImplementation(async (callback: (tx: {insert: typeof txInsert}) => Promise<unknown>) =>
      callback({insert: txInsert}),
    );

    const categories = Array.from({length: 1500}, () => ({
      id: crypto.randomUUID(),
      name: 'Category',
      description: null,
    }));

    await importApplicationArchive(categoriesArchive(categories), 'user-1', 'commit');

    expect(txInsert).toHaveBeenCalledTimes(2);
    expect(insertValues).toHaveBeenCalledTimes(2);
  });

  it('rejects malformed archives as format errors', async () => {
    await expect(importApplicationArchive(Buffer.from('not a zip'), 'user-1', 'commit')).rejects.toBeInstanceOf(
      ApplicationImportFormatError,
    );
  });
});
