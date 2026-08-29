import {describe, expect, it} from 'vitest';
import {createZipArchive} from '../router/applicationExport';
import {parseApplicationImportArchive} from '../router/applicationImport';

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
