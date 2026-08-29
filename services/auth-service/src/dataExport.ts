import {fromNodeHeaders} from 'better-auth/node';
import type {RequestHandler} from 'express';
import {HTTPStatusCode} from './models';

type TExportValue = string | number | boolean | Date | null;
export type TExportRecord = Record<string, TExportValue>;

export type TExportFormat = 'csv' | 'json';

export type TAuthExportData = {
  user: TExportRecord;
  sessions: TExportRecord[];
  accounts: TExportRecord[];
  apiKeys: TExportRecord[];
};

type TExportDependencies = {
  getSession: (headers: Headers) => Promise<{user: {id: string}} | null>;
  getData: (userId: string) => Promise<TAuthExportData>;
};

type TExportResource = keyof Omit<TAuthExportData, 'user'> | 'user';

const exportColumns: Record<TExportResource, string[]> = {
  user: ['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt'],
  sessions: ['id', 'userId', 'expiresAt', 'createdAt', 'updatedAt', 'ipAddress', 'userAgent'],
  accounts: [
    'id',
    'accountId',
    'providerId',
    'userId',
    'accessTokenExpiresAt',
    'refreshTokenExpiresAt',
    'scope',
    'createdAt',
    'updatedAt',
  ],
  // auth.apikey.key is deliberately never selected or exported.
  apiKeys: [
    'id',
    'name',
    'referenceId',
    'enabled',
    'createdAt',
    'updatedAt',
    'expiresAt',
    'rateLimitEnabled',
    'rateLimitTimeWindow',
    'rateLimitMax',
    'requestCount',
    'remaining',
    'lastRequest',
  ],
};

const resourceFileNames: Record<TExportResource, string> = {
  user: 'user',
  sessions: 'sessions',
  accounts: 'accounts',
  apiKeys: 'api-keys',
};

const crc32Table = Uint32Array.from({length: 256}, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function calculateCrc32(data: Buffer): number {
  let value = 0xffffffff;
  for (const byte of data) value = crc32Table[(value ^ byte) & 0xff]! ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function createZip(files: Array<{name: string; content: string}>): Buffer {
  const localFiles: Buffer[] = [];
  const centralDirectory: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8');
    const content = Buffer.from(file.content, 'utf8');
    const crc32 = calculateCrc32(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt32LE(crc32, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt32LE(crc32, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt32LE(offset, 42);

    localFiles.push(localHeader, name, content);
    centralDirectory.push(centralHeader, name);
    offset += localHeader.length + name.length + content.length;
  }

  const centralDirectoryData = Buffer.concat(centralDirectory);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(files.length, 8);
  endOfCentralDirectory.writeUInt16LE(files.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectoryData.length, 12);
  endOfCentralDirectory.writeUInt32LE(offset, 16);

  return Buffer.concat([...localFiles, centralDirectoryData, endOfCentralDirectory]);
}

function serializeValue(value: TExportValue): string | number | boolean | null {
  return value instanceof Date ? value.toISOString() : value;
}

function serializeCsvValue(value: TExportValue): string {
  const serialized = serializeValue(value);
  let text = serialized === null ? '' : String(serialized);
  // Prevent spreadsheet applications from interpreting exported account data as a formula.
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function serializeResource(records: TExportRecord[], columns: string[], format: TExportFormat): string {
  if (format === 'json') {
    return `${JSON.stringify(
      records.map(record =>
        Object.fromEntries(columns.map(column => [column, serializeValue(record[column] ?? null)])),
      ),
      null,
      2,
    )}\n`;
  }

  return `${[columns.join(','), ...records.map(record => columns.map(column => serializeCsvValue(record[column] ?? null)).join(','))].join('\n')}\n`;
}

export function createAuthExportArchive(data: TAuthExportData, format: TExportFormat, exportedAt = new Date()): Buffer {
  const extension = format;
  const resources: Array<[TExportResource, TExportRecord[]]> = [
    ['user', [data.user]],
    ['sessions', data.sessions],
    ['accounts', data.accounts],
    ['apiKeys', data.apiKeys],
  ];
  const files = resources.map(([resource, records]) => ({
    name: `${resourceFileNames[resource]}.${extension}`,
    content: serializeResource(records, exportColumns[resource], format),
  }));
  const manifest = {
    schemaVersion: 1,
    archiveFormat: 'zip',
    format,
    exportedAt: exportedAt.toISOString(),
    resources: resources.map(([resource, records]) => ({
      file: `${resourceFileNames[resource]}.${extension}`,
      records: records.length,
      fields: exportColumns[resource],
    })),
  };

  return createZip([...files, {name: 'manifest.json', content: `${JSON.stringify(manifest, null, 2)}\n`}]);
}

export function createAuthExportHandler({getSession, getData}: TExportDependencies): RequestHandler {
  return async (req, res) => {
    res.set({'Cache-Control': 'no-store', Pragma: 'no-cache'});
    const authenticatedSession = await getSession(fromNodeHeaders(req.headers));
    if (!authenticatedSession) {
      res.status(HTTPStatusCode.UNAUTHORIZED).json({error: 'Unauthorized'});
      return;
    }

    const format = req.query.format;
    if (format !== undefined && format !== 'json' && format !== 'csv') {
      res.status(HTTPStatusCode.BAD_REQUEST).json({error: "format must be either 'json' or 'csv'"});
      return;
    }

    const selectedFormat: TExportFormat = format ?? 'json';
    const archive = createAuthExportArchive(await getData(authenticatedSession.user.id), selectedFormat);
    const date = new Date().toISOString().slice(0, 10);

    res
      .status(HTTPStatusCode.OK)
      .set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="budgetbuddy-auth-export-${date}.zip"`,
        'X-Content-Type-Options': 'nosniff',
      })
      .send(archive);
  };
}
