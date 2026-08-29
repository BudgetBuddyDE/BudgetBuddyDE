import {describe, expect, it} from 'vitest';
import {applicationExportQuerySchema, createZipArchive, serializeCsv} from '../router/applicationExport';

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
    {format: 'json', resources: 'attachments'},
  ])('rejects unsupported export requests: %o', query => {
    expect(applicationExportQuerySchema.safeParse(query).success).toBe(false);
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
