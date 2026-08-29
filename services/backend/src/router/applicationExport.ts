import {gunzipSync} from 'node:zlib';
import z from 'zod';

export const applicationExportResources = [
  'categories',
  'payment-methods',
  'transactions',
  'recurring-payments',
  'budgets',
  'attachments',
] as const;

export type TApplicationExportResource = (typeof applicationExportResources)[number];

export const applicationExportQuerySchema = z.object({
  format: z.enum(['csv', 'json']),
  resources: z
    .union([z.enum(applicationExportResources), z.array(z.enum(applicationExportResources))])
    .transform(value => (Array.isArray(value) ? value : [value]))
    .pipe(z.array(z.enum(applicationExportResources)).min(1))
    .transform(resources => [...new Set(resources)]),
});

export type TApplicationExportRow = Record<string, unknown>;

type TransformableObjectBody = {
  transformToByteArray: () => Promise<Uint8Array>;
};

function isTransformableObjectBody(body: unknown): body is TransformableObjectBody {
  return typeof body === 'object' && body !== null && 'transformToByteArray' in body;
}

function isAsyncIterableObjectBody(body: unknown): body is AsyncIterable<Uint8Array | string> {
  return typeof body === 'object' && body !== null && Symbol.asyncIterator in body;
}

/** Converts an S3 object body into its original uploaded bytes. */
export async function objectBodyToBuffer(body: unknown, contentEncoding?: string): Promise<Buffer> {
  let buffer: Buffer;

  if (body instanceof Uint8Array) {
    buffer = Buffer.from(body);
  } else if (isTransformableObjectBody(body)) {
    buffer = Buffer.from(await body.transformToByteArray());
  } else if (isAsyncIterableObjectBody(body)) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) chunks.push(Buffer.from(chunk));
    buffer = Buffer.concat(chunks);
  } else {
    throw new Error('Attachment object body is unavailable');
  }

  return contentEncoding?.split(',').some(encoding => encoding.trim().toLowerCase() === 'gzip')
    ? gunzipSync(buffer)
    : buffer;
}

/** Keeps original file names readable while keeping archive paths independent of object-store keys. */
export function attachmentExportPath(attachmentId: string, fileName: string): string {
  const safeFileName =
    [...fileName]
      .map(character => (character === '/' || character === '\\' || character.charCodeAt(0) < 32 ? '_' : character))
      .join('')
      .replace(/^\.+/, '') || 'attachment';
  return `attachments/${Buffer.from(attachmentId, 'utf8').toString('base64url')}/${safeFileName}`;
}

const csvFormulaPrefix = /^[\t\r\n ]*[=+\-@]/;

function formatExportValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeCsvValue(value: unknown): string {
  let text = formatExportValue(value);
  // Prevent spreadsheet applications from treating exported text as a formula.
  if (csvFormulaPrefix.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function serializeCsv(rows: TApplicationExportRow[], columns: readonly string[]): string {
  const header = columns.map(escapeCsvValue).join(',');
  const records = rows.map(row => columns.map(column => escapeCsvValue(row[column])).join(','));
  return `${[header, ...records].join('\r\n')}\r\n`;
}

function calculateCrc32(content: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of content) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): {date: number; time: number} {
  const year = Math.min(Math.max(date.getFullYear(), 1980), 2107);
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
  };
}

interface IZipEntry {
  name: string;
  content: Buffer;
}

/** Creates a ZIP with stored entries, avoiding an undeclared archive dependency. */
export function createZipArchive(entries: IZipEntry[], createdAt = new Date()): Buffer {
  if (entries.length > 0xffff) throw new Error('ZIP archive contains too many files');

  const {date, time} = dosDateTime(createdAt);
  let offset = 0;
  const localEntries: Buffer[] = [];
  const centralEntries: Buffer[] = [];

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    if (name.length > 0xffff || entry.content.length > 0xffffffff || offset > 0xffffffff) {
      throw new Error('ZIP archive entry is too large');
    }

    const crc = calculateCrc32(entry.content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(entry.content.length, 18);
    localHeader.writeUInt32LE(entry.content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localEntries.push(localHeader, name, entry.content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(0x0314, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(entry.content.length, 20);
    centralHeader.writeUInt32LE(entry.content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralEntries.push(centralHeader, name);
    offset += localHeader.length + name.length + entry.content.length;
  }

  const centralDirectory = Buffer.concat(centralEntries);
  if (centralDirectory.length > 0xffffffff || offset + centralDirectory.length > 0xffffffff) {
    throw new Error('ZIP archive is too large');
  }

  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(entries.length, 8);
  endOfCentralDirectory.writeUInt16LE(entries.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDirectory.writeUInt32LE(offset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  return Buffer.concat([...localEntries, centralDirectory, endOfCentralDirectory]);
}
