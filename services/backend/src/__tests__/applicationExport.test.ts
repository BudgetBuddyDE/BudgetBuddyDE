import {Readable} from 'node:stream';
import {gzipSync} from 'node:zlib';
import {describe, expect, it} from 'vitest';
import {
  applicationExportQuerySchema,
  attachmentExportPath,
  createZipArchive,
  objectBodyToBuffer,
  serializeCsv,
} from '../router/applicationExport';

describe('application export query validation', () => {
  it('accepts selected resources and removes duplicate selections', () => {
    expect(
      applicationExportQuerySchema.parse({
        format: 'csv',
        resources: ['categories', 'budgets', 'categories'],
      }),
    ).toEqual({format: 'csv', resources: ['categories', 'budgets']});
  });

  it.each([
    {format: 'xml', resources: 'categories'},
    {format: 'json', resources: []},
    {format: 'json', resources: 'unknown-resource'},
  ])('rejects unsupported export requests: %o', query => {
    expect(applicationExportQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe('application attachment export helpers', () => {
  it('restores gzip-compressed streamed object bodies', async () => {
    const original = Buffer.from('receipt content');
    const body = Readable.from([gzipSync(original)]);

    await expect(objectBodyToBuffer(body, 'gzip')).resolves.toEqual(original);
  });

  it('creates safe, collision-free content paths while preserving file names', () => {
    const firstPath = attachmentExportPath('../receipt', '../../receipt.pdf');
    const secondPath = attachmentExportPath('receipt', 'receipt.pdf');

    expect(firstPath).toMatch(/^attachments\/[A-Za-z0-9_-]+\/_.+\.pdf$/);
    expect(firstPath).not.toBe(secondPath);
  });
});

describe('application export serialization', () => {
  it('quotes CSV values and neutralizes spreadsheet formulas', () => {
    expect(serializeCsv([{name: '=SUM(A1:A2)', note: 'He said "hello"'}], ['name', 'note'])).toBe(
      '"name","note"\r\n"\'=SUM(A1:A2)","He said ""hello"""\r\n',
    );
  });

  it('creates a ZIP archive containing local entries and a central directory', () => {
    const archive = createZipArchive([
      {name: 'manifest.json', content: Buffer.from('{"attachmentsIncluded":false}\n')},
    ]);

    expect(archive.readUInt32LE(0)).toBe(0x04034b50);
    expect(archive.includes(Buffer.from('manifest.json'))).toBe(true);
    expect(archive.readUInt32LE(archive.length - 22)).toBe(0x06054b50);
  });
});
