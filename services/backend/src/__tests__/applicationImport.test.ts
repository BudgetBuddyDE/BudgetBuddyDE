import {budgetCategories} from '@budgetbuddyde/db/backend';
import {PgDialect} from 'drizzle-orm/pg-core';
import {beforeEach, describe, expect, it, vi} from 'vite-plus/test';
import {db} from './mocks/db';
import {createZipArchive, serializeCsv} from '../router/applicationExport';
import {
  ApplicationImportFormatError,
  importApplicationArchive,
  parseApplicationImportArchive,
} from '../router/applicationImport';

const transaction = db.transaction;
const findCategories = db.query.categories.findMany;
const lockReferences = vi.fn();

beforeEach(() => {
  lockReferences.mockReset().mockResolvedValue([]);
  db.select.mockImplementation(() => ({
    from: () => ({
      where: (where: unknown) => ({orderBy: () => ({for: (mode: string) => lockReferences(mode, where)})}),
    }),
  }));
});

async function categoriesArchive(categories: Array<{id: string; name: string; description: null}>) {
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

describe('H09/H10 category backup compatibility', () => {
  it('bounds preview and commit lookups and locks owner-scoped references in UUID order', async () => {
    const ids = Array.from({length: 1001}, (_, i) => `aaa00000-0000-4000-8000-${String(i).padStart(12, '0')}`);
    const archive = await categoriesArchive(
      ids.toReversed().map((id, i) => ({id: id.toUpperCase(), name: `Category ${i}`, description: null})),
    );
    findCategories.mockClear();
    lockReferences.mockClear();
    transaction.mockImplementationOnce(async callback => callback({...db, insert: () => ({values: vi.fn()})}));
    const dialect = new PgDialect();
    try {
      for (const mode of ['preview', 'commit'] as const) {
        expect((await importApplicationArchive(archive, 'owner', mode)).summary.created).toBe(ids.length);
      }
      const previewLookups = findCategories.mock.calls
        .slice(0, 2)
        .map(([args]) => dialect.sqlToQuery(args.where).params);
      expect(previewLookups).toEqual([
        ['owner', ...ids.slice(0, 1000)],
        ['owner', ids[1000]],
      ]);
      const locks = lockReferences.mock.calls.map(([mode, where]) => [mode, dialect.sqlToQuery(where).params]);
      expect(locks).toEqual(previewLookups.map(params => ['share', params]));
      const conflictLookups = findCategories.mock.calls.slice(2);
      expect(conflictLookups).toHaveLength(4);
      expect(
        conflictLookups.map(([args]) =>
          args.where({id: 'id'}, {inArray: (_: unknown, batch: string[]) => batch.length}),
        ),
      ).toEqual([1000, 1, 1000, 1]);
    } finally {
      transaction.mockReset();
    }
  });

  it('restores all budget links from a ZIP that would exceed the PostgreSQL bind limit without link batching', async () => {
    const categories = Array.from({length: 55}, (_, index) => ({id: crypto.randomUUID(), name: `Category ${index}`}));
    const categoryIds = categories.map(category => category.id);
    const budgets = Array.from({length: 400}, (_, index) => ({
      id: crypto.randomUUID(),
      name: `Budget ${index}`,
      budget: 100,
      type: 'i',
      categoryIds,
    }));
    const resources = [
      {file: 'categories.json', resource: 'categories', rowCount: categories.length},
      {file: 'budgets.json', resource: 'budgets', rowCount: budgets.length},
    ];
    const archive = await createZipArchive([
      {
        name: 'manifest.json',
        content: Buffer.from(JSON.stringify({archiveFormat: 'zip', format: 'json', schemaVersion: 1, resources})),
      },
      {name: 'categories.json', content: Buffer.from(JSON.stringify(categories))},
      {name: 'budgets.json', content: Buffer.from(JSON.stringify(budgets))},
    ]);
    const linkBatch = vi.fn((rows: (typeof budgetCategories.$inferInsert)[]) => {
      expect(rows.length * 3).toBeLessThanOrEqual(65_535);
    });
    transaction.mockReset().mockImplementation(async callback =>
      callback({
        ...db,
        insert: (table: unknown) => ({values: table === budgetCategories ? linkBatch : vi.fn()}),
      }),
    );
    try {
      const expected = {received: 455, created: 455, skipped: 0, failed: 0};
      expect((await importApplicationArchive(archive, 'owner', 'preview')).summary).toEqual(expected);
      expect(transaction).not.toHaveBeenCalled();
      expect((await importApplicationArchive(archive, 'owner', 'commit')).summary).toEqual(expected);
      expect(transaction).toHaveBeenCalledOnce();
      expect(linkBatch.mock.calls.length).toBeGreaterThan(1);
      expect(linkBatch.mock.calls.flatMap(([rows]) => rows)).toEqual(
        budgets.flatMap(budget => categoryIds.map(categoryId => ({ownerId: 'owner', budgetId: budget.id, categoryId}))),
      );
    } finally {
      transaction.mockReset();
    }
  });

  it.each(['csv', 'json'])(
    '%s restores roots before children, preserves conflicts, and reports invalid parents',
    async format => {
      const [root, child, conflict, foreign, missing, legacy, invalid, invalidForeign] = Array.from({length: 8}, () =>
        crypto.randomUUID(),
      );
      const rows = [
        {id: child, name: 'Child first', parentId: root},
        {id: conflict, name: 'Must not overwrite', parentId: root},
        {id: invalid, name: 'Missing', parentId: missing},
        {id: invalidForeign, name: 'Foreign', parentId: foreign},
        {id: root, name: 'Root', parentId: null},
        {id: legacy, name: 'Legacy without parent'},
      ];
      const file = `categories.${format}`;
      const archive = await createZipArchive([
        {
          name: file,
          content: Buffer.from(
            format === 'csv' ? serializeCsv(rows, ['id', 'name', 'parentId']) : JSON.stringify(rows),
          ),
        },
        {
          name: 'manifest.json',
          content: Buffer.from(
            JSON.stringify({
              archiveFormat: 'zip',
              format,
              resources: [{file, resource: 'categories', rowCount: rows.length}],
              schemaVersion: 1,
            }),
          ),
        },
      ]);
      const existing = [
        {id: conflict, ownerId: 'owner', parentId: missing},
        {id: foreign, ownerId: 'foreign', parentId: null},
      ];
      findCategories.mockResolvedValueOnce(existing.filter(row => row.ownerId === 'owner')).mockResolvedValue(existing);
      lockReferences.mockResolvedValue(existing.filter(row => row.ownerId === 'owner'));
      const values = vi.fn().mockResolvedValue(undefined);
      transaction.mockClear().mockImplementation(async callback => callback({...db, insert: () => ({values})}));
      try {
        const preview = await importApplicationArchive(archive, 'owner', 'preview');
        expect(transaction).not.toHaveBeenCalled();
        expect(preview.summary).toEqual({received: 6, created: 3, skipped: 1, failed: 2});
        expect(preview.resources.categories.skipped).toMatchObject([{sourceId: conflict, code: 'conflict'}]);
        expect(preview.resources.categories.failed).toMatchObject([
          {sourceId: invalid, code: 'reference'},
          {sourceId: invalidForeign, code: 'reference'},
        ]);
        expect((await importApplicationArchive(archive, 'owner', 'commit')).summary).toEqual(preview.summary);
        expect(values).toHaveBeenCalledTimes(2);
        expect(values.mock.calls[0][0].map((row: {id: string}) => row.id)).toEqual([root, legacy]);
        expect(values.mock.calls[1][0]).toMatchObject([{id: child, ownerId: 'owner', parentId: root}]);
      } finally {
        findCategories.mockReset().mockResolvedValue([]);
        lockReferences.mockReset().mockResolvedValue([]);
        transaction.mockReset();
      }
    },
  );
});

describe('application import archive parsing', () => {
  it('reads the JSON archive format emitted by application export', async () => {
    const archive = await createZipArchive([
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

  it('rejects archive entries that are not declared by the manifest', async () => {
    const archive = await createZipArchive([
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

  it('restores CSV values escaped by the exporter', async () => {
    const archive = await createZipArchive([
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
      callback({...db, insert: txInsert}),
    );

    const result = await importApplicationArchive(
      await categoriesArchive([{id: '0199d24e-aa34-7f5a-8a9f-5c1bcd4b9e53', name: 'Food', description: null}]),
      'user-1',
      'commit',
    );

    expect(transaction).toHaveBeenCalledOnce();
    expect(txInsert).toHaveBeenCalledOnce();
    expect(result.summary.created).toBe(1);
  });

  it('propagates a write failure so the transaction rolls back', async () => {
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({...db, insert: () => ({values: vi.fn().mockRejectedValue(new Error('write failed'))})}),
    );

    await expect(
      importApplicationArchive(
        await categoriesArchive([{id: '0199d24e-aa34-7f5a-8a9f-5c1bcd4b9e53', name: 'Food', description: null}]),
        'user-1',
        'commit',
      ),
    ).rejects.toThrow('write failed');
  });

  it('chunks large resource inserts', async () => {
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const txInsert = vi.fn().mockReturnValue({values: insertValues});
    transaction.mockImplementation(async (callback: (tx: {insert: typeof txInsert}) => Promise<unknown>) =>
      callback({...db, insert: txInsert}),
    );

    const categories = Array.from({length: 1500}, () => ({
      id: crypto.randomUUID(),
      name: 'Category',
      description: null,
    }));

    await importApplicationArchive(await categoriesArchive(categories), 'user-1', 'commit');

    expect(txInsert).toHaveBeenCalledTimes(2);
    expect(insertValues).toHaveBeenCalledTimes(2);
  });

  it('rejects malformed archives as format errors', async () => {
    await expect(importApplicationArchive(Buffer.from('not a zip'), 'user-1', 'commit')).rejects.toBeInstanceOf(
      ApplicationImportFormatError,
    );
  });
});
