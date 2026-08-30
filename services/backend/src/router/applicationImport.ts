import {
  budgetCategories,
  budgets,
  categories,
  paymentMethods,
  recurringPayments,
  transactions,
} from '@budgetbuddyde/db/backend';
import {eq} from 'drizzle-orm';
import z from 'zod';
import {db} from '../db';

export const applicationImportResources = [
  'categories',
  'payment-methods',
  'transactions',
  'recurring-payments',
  'budgets',
] as const;

export type TApplicationImportResource = (typeof applicationImportResources)[number];
export type TApplicationImportMode = 'preview' | 'commit';

export type TApplicationImportRecord = {
  sourceId?: string;
  row: number;
  code: 'conflict' | 'duplicate' | 'persistence' | 'reference' | 'validation';
  message: string;
};

export type TApplicationImportPreviewRecord = {
  data: Record<string, boolean | number | string | null>;
  row: number;
  sourceId?: string;
};

export type TApplicationImportResourceResult = {
  created: TApplicationImportRecord[];
  skipped: TApplicationImportRecord[];
  failed: TApplicationImportRecord[];
};

export type TApplicationImportResult = {
  mode: TApplicationImportMode;
  preview: Record<TApplicationImportResource, TApplicationImportPreviewRecord[]>;
  resources: Record<TApplicationImportResource, TApplicationImportResourceResult>;
  summary: {
    created: number;
    failed: number;
    received: number;
    skipped: number;
  };
};

const archiveManifestSchema = z.object({
  archiveFormat: z.literal('zip'),
  attachmentsIncluded: z.boolean().optional(),
  format: z.enum(['csv', 'json']),
  resources: z.array(
    z.object({
      file: z.string(),
      resource: z.enum(applicationImportResources),
      rowCount: z.number().int().nonnegative(),
    }),
  ),
  schemaVersion: z.literal(1),
});

const categorySchema = z.object({
  description: z.string().nullable().optional(),
  id: z.uuid(),
  name: z.string().min(1).max(40),
});
const paymentMethodSchema = z.object({
  address: z.string().min(1).max(32),
  description: z.string().nullable().optional(),
  id: z.uuid(),
  name: z.string().min(1).max(40),
  provider: z.string().min(1).max(32),
});
const transactionSchema = z.object({
  categoryId: z.uuid(),
  id: z.uuid(),
  information: z.string().nullable().optional(),
  paymentMethodId: z.uuid(),
  processedAt: z.iso.datetime().transform(value => new Date(value)),
  receiver: z.string().min(1).max(100),
  transferAmount: z.coerce.number().finite(),
});
const recurringPaymentSchema = transactionSchema.omit({processedAt: true}).extend({
  executionPlan: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  paused: z.boolean(),
  startsOn: z.iso.date(),
});
const budgetSchema = z.object({
  budget: z.coerce.number().finite().min(0),
  categoryIds: z.array(z.uuid()),
  description: z.string().nullable().optional(),
  id: z.uuid(),
  name: z.string().min(1).max(32),
  type: z.enum(['i', 'e']),
});

export type TApplicationImportArchiveRows = Partial<
  Record<TApplicationImportResource, Array<{row: number; value: unknown}>>
>;

const MAX_ARCHIVE_SIZE = 20 * 1024 * 1024;
const MAX_ARCHIVE_ENTRY_SIZE = 5 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = applicationImportResources.length + 1;
const MAX_ROWS_PER_RESOURCE = 10_000;

function createResourceResult(): TApplicationImportResourceResult {
  return {created: [], skipped: [], failed: []};
}

function createResult(mode: TApplicationImportMode): TApplicationImportResult {
  return {
    mode,
    preview: {
      categories: [],
      'payment-methods': [],
      transactions: [],
      'recurring-payments': [],
      budgets: [],
    },
    resources: {
      categories: createResourceResult(),
      'payment-methods': createResourceResult(),
      transactions: createResourceResult(),
      'recurring-payments': createResourceResult(),
      budgets: createResourceResult(),
    },
    summary: {created: 0, failed: 0, received: 0, skipped: 0},
  };
}

const previewFields: Record<TApplicationImportResource, readonly string[]> = {
  categories: ['id', 'name', 'description'],
  'payment-methods': ['id', 'name', 'provider', 'address', 'description'],
  transactions: ['id', 'categoryId', 'paymentMethodId', 'processedAt', 'receiver', 'transferAmount', 'information'],
  'recurring-payments': [
    'id',
    'categoryId',
    'paymentMethodId',
    'executionPlan',
    'startsOn',
    'paused',
    'receiver',
    'transferAmount',
    'information',
  ],
  budgets: ['id', 'type', 'name', 'budget', 'description', 'categoryIds'],
};

function previewData(
  resource: TApplicationImportResource,
  value: unknown,
): Record<string, boolean | number | string | null> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const data: Record<string, boolean | number | string | null> = {};
  for (const field of previewFields[resource]) {
    const fieldValue = source[field];
    if (fieldValue === undefined) continue;
    data[field] =
      fieldValue === null || typeof fieldValue === 'boolean' || typeof fieldValue === 'number'
        ? fieldValue
        : typeof fieldValue === 'string'
          ? fieldValue
          : JSON.stringify(fieldValue);
  }
  return data;
}

function addResult(
  result: TApplicationImportResult,
  resource: TApplicationImportResource,
  status: keyof TApplicationImportResourceResult,
  record: TApplicationImportRecord,
) {
  result.resources[resource][status].push(record);
  if (status === 'created') result.summary.created += 1;
  if (status === 'skipped') result.summary.skipped += 1;
  if (status === 'failed') result.summary.failed += 1;
}

function parseCsv(content: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let cell = '';
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (quoted) {
      if (character === '"' && content[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else cell += character;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else cell += character;
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted value');
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows.shift();
  if (!headers || headers.some(header => header.length === 0)) throw new Error('CSV requires a header row');
  return rows
    .filter(rowValues => rowValues.some(value => value.length > 0))
    .map(rowValues => Object.fromEntries(headers.map((header, index) => [header, rowValues[index] ?? ''])));
}

function normalizeCsvRow(resource: TApplicationImportResource, row: Record<string, string>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {...row};
  for (const [key, value] of Object.entries(normalized)) {
    // Reverse the formula-prefix escaping applied by the CSV exporter.
    if (typeof value === 'string' && /^'[\t\r\n ]*[=+\-@]/.test(value)) normalized[key] = value.slice(1);
  }
  for (const key of ['description', 'information']) {
    if (normalized[key] === '') normalized[key] = null;
  }
  if (resource === 'transactions' || resource === 'recurring-payments') {
    normalized.transferAmount = Number(row.transferAmount);
  }
  if (resource === 'recurring-payments') normalized.paused = row.paused === 'true';
  if (resource === 'budgets') {
    normalized.budget = Number(row.budget);
    try {
      normalized.categoryIds = JSON.parse(row.categoryIds || '[]');
    } catch {
      normalized.categoryIds = row.categoryIds;
    }
  }
  return normalized;
}

/** Reads only stored ZIP entries, which is the archive format emitted by the application export. */
function readStoredZipArchive(archive: Buffer): Map<string, Buffer> {
  if (archive.length > MAX_ARCHIVE_SIZE) throw new Error('The archive exceeds the maximum size of 20 MB');
  const files = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 4 <= archive.length) {
    const signature = archive.readUInt32LE(offset);
    if (signature === 0x02014b50 || signature === 0x06054b50) break;
    if (signature !== 0x04034b50 || offset + 30 > archive.length)
      throw new Error('The archive is not a supported ZIP export');
    const flags = archive.readUInt16LE(offset + 6);
    const compression = archive.readUInt16LE(offset + 8);
    const compressedSize = archive.readUInt32LE(offset + 18);
    const uncompressedSize = archive.readUInt32LE(offset + 22);
    const nameLength = archive.readUInt16LE(offset + 26);
    const extraLength = archive.readUInt16LE(offset + 28);
    if (flags !== 0x0800 || compression !== 0 || compressedSize !== uncompressedSize) {
      throw new Error('The archive uses an unsupported ZIP compression format');
    }
    if (uncompressedSize > MAX_ARCHIVE_ENTRY_SIZE || files.size >= MAX_ARCHIVE_ENTRIES) {
      throw new Error('The archive contains too much data');
    }
    const dataStart = offset + 30 + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > archive.length) throw new Error('The archive contains a truncated file');
    const name = archive.subarray(offset + 30, offset + 30 + nameLength).toString('utf8');
    if (!name || name.includes('..') || name.includes('\\') || name.includes('/') || files.has(name)) {
      throw new Error('The archive contains an invalid file path');
    }
    files.set(name, archive.subarray(dataStart, dataEnd));
    offset = dataEnd;
  }
  return files;
}

export function parseApplicationImportArchive(archive: Buffer): TApplicationImportArchiveRows {
  const files = readStoredZipArchive(archive);
  const manifestBuffer = files.get('manifest.json');
  if (!manifestBuffer) throw new Error('The archive does not contain a manifest');
  let manifestData: unknown;
  try {
    manifestData = JSON.parse(manifestBuffer.toString('utf8'));
  } catch {
    throw new Error('The archive manifest is not valid JSON');
  }
  const manifest = archiveManifestSchema.safeParse(manifestData);
  if (!manifest.success) throw new Error('The archive manifest is invalid or unsupported');
  if (manifest.data.attachmentsIncluded) throw new Error('Attachment archives cannot be imported');
  if (
    manifest.data.resources.some(entry => !applicationImportResources.includes(entry.resource)) ||
    new Set(manifest.data.resources.map(entry => entry.resource)).size !== manifest.data.resources.length
  ) {
    throw new Error('The archive contains an unsupported resource');
  }

  const expectedFiles = new Set(['manifest.json', ...manifest.data.resources.map(entry => entry.file)]);
  if (files.size !== expectedFiles.size || [...files.keys()].some(file => !expectedFiles.has(file))) {
    throw new Error('The archive contains unexpected files');
  }

  const rows: TApplicationImportArchiveRows = {};
  for (const entry of manifest.data.resources) {
    if (entry.file !== `${entry.resource}.${manifest.data.format}`)
      throw new Error('The archive manifest contains an invalid file');
    const file = files.get(entry.file);
    if (!file) throw new Error(`The archive is missing ${entry.file}`);
    let parsed: unknown[];
    try {
      parsed = manifest.data.format === 'json' ? JSON.parse(file.toString('utf8')) : parseCsv(file.toString('utf8'));
    } catch (error) {
      throw new Error(`Unable to read ${entry.file}: ${error instanceof Error ? error.message : 'invalid data'}`);
    }
    if (!Array.isArray(parsed) || parsed.length > MAX_ROWS_PER_RESOURCE) {
      throw new Error(`${entry.file} contains an invalid number of records`);
    }
    if (parsed.length !== entry.rowCount) throw new Error(`${entry.file} does not match the manifest row count`);
    rows[entry.resource] = parsed.map((value, index) => ({
      row: manifest.data.format === 'csv' ? index + 2 : index + 1,
      value: manifest.data.format === 'csv' ? normalizeCsvRow(entry.resource, value as Record<string, string>) : value,
    }));
  }
  return rows;
}

function sourceId(value: unknown): string | undefined {
  return typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string'
    ? value.id
    : undefined;
}

function validationMessage(error: z.ZodError): string {
  return error.issues.map(issue => `${issue.path.join('.') || 'record'}: ${issue.message}`).join('; ');
}

function addValidationFailure(
  result: TApplicationImportResult,
  resource: TApplicationImportResource,
  row: number,
  value: unknown,
  error: z.ZodError,
) {
  addResult(result, resource, 'failed', {
    sourceId: sourceId(value),
    row,
    code: 'validation',
    message: validationMessage(error),
  });
}

export async function importApplicationArchive(
  archive: Buffer,
  userId: string,
  mode: TApplicationImportMode,
): Promise<TApplicationImportResult> {
  const archiveRows = parseApplicationImportArchive(archive);
  const result = createResult(mode);
  const availableCategories = new Set<string>();
  const availablePaymentMethods = new Set<string>();
  const seenIds: Record<TApplicationImportResource, Set<string>> = {
    categories: new Set(),
    'payment-methods': new Set(),
    transactions: new Set(),
    'recurring-payments': new Set(),
    budgets: new Set(),
  };
  for (const resource of applicationImportResources) {
    const entries = archiveRows[resource] ?? [];
    result.summary.received += entries.length;
    result.preview[resource] = entries.map(entry => ({
      data: previewData(resource, entry.value),
      row: entry.row,
      sourceId: sourceId(entry.value),
    }));
  }

  for (const entry of archiveRows.categories ?? []) {
    const parsed = categorySchema.safeParse(entry.value);
    if (!parsed.success) {
      addValidationFailure(result, 'categories', entry.row, entry.value, parsed.error);
      continue;
    }
    const value = parsed.data;
    if (seenIds.categories.has(value.id)) {
      addResult(result, 'categories', 'failed', {
        sourceId: value.id,
        row: entry.row,
        code: 'duplicate',
        message: 'The archive contains this category ID more than once',
      });
      continue;
    }
    seenIds.categories.add(value.id);
    const existing = await db.query.categories.findFirst({
      columns: {ownerId: true},
      where: eq(categories.id, value.id),
    });
    if (existing) {
      if (existing.ownerId === userId) {
        availableCategories.add(value.id);
        addResult(result, 'categories', 'skipped', {
          sourceId: value.id,
          row: entry.row,
          code: 'conflict',
          message: 'Category already exists and was skipped',
        });
      } else
        addResult(result, 'categories', 'failed', {
          sourceId: value.id,
          row: entry.row,
          code: 'conflict',
          message: 'Category ID belongs to another user',
        });
      continue;
    }
    try {
      if (mode === 'commit') await db.insert(categories).values({...value, ownerId: userId});
      availableCategories.add(value.id);
      addResult(result, 'categories', 'created', {
        sourceId: value.id,
        row: entry.row,
        code: 'persistence',
        message: mode === 'preview' ? 'Ready to import' : 'Imported',
      });
    } catch {
      addResult(result, 'categories', 'failed', {
        sourceId: value.id,
        row: entry.row,
        code: 'persistence',
        message: 'Category could not be saved',
      });
    }
  }

  for (const entry of archiveRows['payment-methods'] ?? []) {
    const parsed = paymentMethodSchema.safeParse(entry.value);
    if (!parsed.success) {
      addValidationFailure(result, 'payment-methods', entry.row, entry.value, parsed.error);
      continue;
    }
    const value = parsed.data;
    if (seenIds['payment-methods'].has(value.id)) {
      addResult(result, 'payment-methods', 'failed', {
        sourceId: value.id,
        row: entry.row,
        code: 'duplicate',
        message: 'The archive contains this payment method ID more than once',
      });
      continue;
    }
    seenIds['payment-methods'].add(value.id);
    const existing = await db.query.paymentMethods.findFirst({
      columns: {ownerId: true},
      where: eq(paymentMethods.id, value.id),
    });
    if (existing) {
      if (existing.ownerId === userId) {
        availablePaymentMethods.add(value.id);
        addResult(result, 'payment-methods', 'skipped', {
          sourceId: value.id,
          row: entry.row,
          code: 'conflict',
          message: 'Payment method already exists and was skipped',
        });
      } else
        addResult(result, 'payment-methods', 'failed', {
          sourceId: value.id,
          row: entry.row,
          code: 'conflict',
          message: 'Payment method ID belongs to another user',
        });
      continue;
    }
    try {
      if (mode === 'commit') await db.insert(paymentMethods).values({...value, ownerId: userId});
      availablePaymentMethods.add(value.id);
      addResult(result, 'payment-methods', 'created', {
        sourceId: value.id,
        row: entry.row,
        code: 'persistence',
        message: mode === 'preview' ? 'Ready to import' : 'Imported',
      });
    } catch {
      addResult(result, 'payment-methods', 'failed', {
        sourceId: value.id,
        row: entry.row,
        code: 'persistence',
        message: 'Payment method could not be saved',
      });
    }
  }

  for (const [resource, rows] of [
    ['transactions', archiveRows.transactions ?? []],
    ['recurring-payments', archiveRows['recurring-payments'] ?? []],
  ] as const) {
    for (const entry of rows) {
      const schema = resource === 'transactions' ? transactionSchema : recurringPaymentSchema;
      const parsed = schema.safeParse(entry.value);
      if (!parsed.success) {
        addValidationFailure(result, resource, entry.row, entry.value, parsed.error);
        continue;
      }
      const value = parsed.data;
      if (seenIds[resource].has(value.id)) {
        addResult(result, resource, 'failed', {
          sourceId: value.id,
          row: entry.row,
          code: 'duplicate',
          message: `The archive contains this ${resource} ID more than once`,
        });
        continue;
      }
      seenIds[resource].add(value.id);
      if (!availableCategories.has(value.categoryId)) {
        const category = await db.query.categories.findFirst({
          columns: {ownerId: true},
          where: eq(categories.id, value.categoryId),
        });
        if (category?.ownerId === userId) availableCategories.add(value.categoryId);
      }
      if (!availablePaymentMethods.has(value.paymentMethodId)) {
        const paymentMethod = await db.query.paymentMethods.findFirst({
          columns: {ownerId: true},
          where: eq(paymentMethods.id, value.paymentMethodId),
        });
        if (paymentMethod?.ownerId === userId) availablePaymentMethods.add(value.paymentMethodId);
      }
      if (!availableCategories.has(value.categoryId) || !availablePaymentMethods.has(value.paymentMethodId)) {
        addResult(result, resource, 'failed', {
          sourceId: value.id,
          row: entry.row,
          code: 'reference',
          message: 'Referenced category or payment method was not imported',
        });
        continue;
      }
      const existing =
        resource === 'transactions'
          ? await db.query.transactions.findFirst({columns: {ownerId: true}, where: eq(transactions.id, value.id)})
          : await db.query.recurringPayments.findFirst({
              columns: {ownerId: true},
              where: eq(recurringPayments.id, value.id),
            });
      if (existing) {
        addResult(result, resource, existing.ownerId === userId ? 'skipped' : 'failed', {
          sourceId: value.id,
          row: entry.row,
          code: 'conflict',
          message:
            existing.ownerId === userId
              ? `${resource} already exists and was skipped`
              : `${resource} ID belongs to another user`,
        });
        continue;
      }
      try {
        if (mode === 'commit') {
          if (resource === 'transactions') {
            const transaction = transactionSchema.parse(entry.value);
            await db.insert(transactions).values({...transaction, ownerId: userId});
          } else {
            const recurringPayment = recurringPaymentSchema.parse(entry.value);
            await db.insert(recurringPayments).values({...recurringPayment, ownerId: userId});
          }
        }
        addResult(result, resource, 'created', {
          sourceId: value.id,
          row: entry.row,
          code: 'persistence',
          message: mode === 'preview' ? 'Ready to import' : 'Imported',
        });
      } catch {
        addResult(result, resource, 'failed', {
          sourceId: value.id,
          row: entry.row,
          code: 'persistence',
          message: `${resource} could not be saved`,
        });
      }
    }
  }

  for (const entry of archiveRows.budgets ?? []) {
    const parsed = budgetSchema.safeParse(entry.value);
    if (!parsed.success) {
      addValidationFailure(result, 'budgets', entry.row, entry.value, parsed.error);
      continue;
    }
    const value = parsed.data;
    if (seenIds.budgets.has(value.id)) {
      addResult(result, 'budgets', 'failed', {
        sourceId: value.id,
        row: entry.row,
        code: 'duplicate',
        message: 'The archive contains this budget ID more than once',
      });
      continue;
    }
    seenIds.budgets.add(value.id);
    for (const categoryId of value.categoryIds) {
      if (availableCategories.has(categoryId)) continue;
      const category = await db.query.categories.findFirst({
        columns: {ownerId: true},
        where: eq(categories.id, categoryId),
      });
      if (category?.ownerId === userId) availableCategories.add(categoryId);
    }
    if (value.categoryIds.some(categoryId => !availableCategories.has(categoryId))) {
      addResult(result, 'budgets', 'failed', {
        sourceId: value.id,
        row: entry.row,
        code: 'reference',
        message: 'One or more budget categories were not imported',
      });
      continue;
    }
    const existing = await db.query.budgets.findFirst({columns: {ownerId: true}, where: eq(budgets.id, value.id)});
    if (existing) {
      addResult(result, 'budgets', existing.ownerId === userId ? 'skipped' : 'failed', {
        sourceId: value.id,
        row: entry.row,
        code: 'conflict',
        message:
          existing.ownerId === userId ? 'Budget already exists and was skipped' : 'Budget ID belongs to another user',
      });
      continue;
    }
    try {
      if (mode === 'commit') {
        await db.transaction(async tx => {
          const {categoryIds: _categoryIds, ...budget} = value;
          await tx.insert(budgets).values({...budget, ownerId: userId});
          if (value.categoryIds.length > 0)
            await tx
              .insert(budgetCategories)
              .values(value.categoryIds.map(categoryId => ({budgetId: value.id, categoryId})));
        });
      }
      addResult(result, 'budgets', 'created', {
        sourceId: value.id,
        row: entry.row,
        code: 'persistence',
        message: mode === 'preview' ? 'Ready to import' : 'Imported',
      });
    } catch {
      addResult(result, 'budgets', 'failed', {
        sourceId: value.id,
        row: entry.row,
        code: 'persistence',
        message: 'Budget could not be saved',
      });
    }
  }

  return result;
}
