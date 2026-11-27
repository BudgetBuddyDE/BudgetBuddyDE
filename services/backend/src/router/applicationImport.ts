import {
  budgetCategories,
  budgets,
  categories,
  paymentMethods,
  recurringPayments,
  transactions,
} from '@budgetbuddyde/db/backend';
import {and, eq, inArray} from 'drizzle-orm';
import z from 'zod';
import {db} from '../db';
import {lockCategoryHierarchy} from '../domain/categoryHierarchy';

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

/** Raised for malformed or unsupported archives, which are client errors. */
export class ApplicationImportFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationImportFormatError';
  }
}

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

// PostgreSQL UUID order matches lexicographic order on canonical lowercase UUIDs.
const importId = z.uuid().toLowerCase();
const categorySchema = z.object({
  description: z.string().nullable().optional(),
  id: importId,
  name: z.string().min(1).max(40),
  parentId: importId.nullable().optional(),
});
const paymentMethodSchema = z.object({
  address: z.string().min(1).max(32),
  description: z.string().nullable().optional(),
  id: importId,
  name: z.string().min(1).max(40),
  provider: z.string().min(1).max(32),
});
const transactionSchema = z.object({
  categoryId: importId,
  id: importId,
  information: z.string().nullable().optional(),
  paymentMethodId: importId,
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
  categoryIds: z.array(importId),
  description: z.string().nullable().optional(),
  id: importId,
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
/** Keeps lookup and insert statements comfortably below PostgreSQL's parameter limit. */
const QUERY_CHUNK_SIZE = 1000;

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
  categories: ['id', 'name', 'description', 'parentId'],
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
  if (resource === 'categories' && normalized.parentId === '') normalized.parentId = null;
  if (resource === 'transactions' || resource === 'recurring-payments') {
    normalized.transferAmount = Number(normalized.transferAmount);
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

type TImportRecord<T> = {row: number; sourceId: string; value: T};

function chunked<T>(items: readonly T[], size: number = QUERY_CHUNK_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) chunks.push(items.slice(start, start + size));
  return chunks;
}

async function loadExistingOwners(
  // biome-ignore lint/suspicious/noExplicitAny: drizzle relational findMany shares this call shape across tables
  relation: any,
  ids: readonly string[],
): Promise<Map<string, string>> {
  const owners = new Map<string, string>();
  for (const batch of chunked(ids)) {
    const rows: {id: string; ownerId: string}[] = await relation.findMany({
      columns: {id: true, ownerId: true},
      // biome-ignore lint/suspicious/noExplicitAny: drizzle field/operator helpers are structurally typed
      where: (fields: any, operators: any) => operators.inArray(fields.id, batch),
    });
    for (const row of rows) owners.set(row.id, row.ownerId);
  }
  return owners;
}

function collectParsed<S extends z.ZodType>(
  resource: TApplicationImportResource,
  entries: Array<{row: number; value: unknown}>,
  schema: S,
  result: TApplicationImportResult,
): TImportRecord<z.output<S>>[] {
  const records: TImportRecord<z.output<S>>[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const parsed = schema.safeParse(entry.value);
    if (!parsed.success) {
      addValidationFailure(result, resource, entry.row, entry.value, parsed.error);
      continue;
    }
    const value = parsed.data;
    const id = (value as {id: string}).id;
    if (seen.has(id)) {
      addResult(result, resource, 'failed', {
        sourceId: id,
        row: entry.row,
        code: 'duplicate',
        message: `The archive contains this ${resource} ID more than once`,
      });
      continue;
    }
    seen.add(id);
    records.push({row: entry.row, sourceId: id, value});
  }
  return records;
}

export async function importApplicationArchive(
  archive: Buffer,
  userId: string,
  mode: TApplicationImportMode,
): Promise<TApplicationImportResult> {
  let archiveRows: TApplicationImportArchiveRows;
  try {
    archiveRows = parseApplicationImportArchive(archive);
  } catch (error) {
    throw new ApplicationImportFormatError(error instanceof Error ? error.message : 'The import archive is invalid');
  }

  const result = createResult(mode);
  for (const resource of applicationImportResources) {
    const entries = archiveRows[resource] ?? [];
    result.summary.received += entries.length;
    result.preview[resource] = entries.map(entry => ({
      data: previewData(resource, entry.value),
      row: entry.row,
      sourceId: sourceId(entry.value),
    }));
  }

  // Validate the complete archive before any write.
  const parsedCategories = collectParsed('categories', archiveRows.categories ?? [], categorySchema, result);
  const parsedPaymentMethods = collectParsed(
    'payment-methods',
    archiveRows['payment-methods'] ?? [],
    paymentMethodSchema,
    result,
  );
  const parsedTransactions = collectParsed('transactions', archiveRows.transactions ?? [], transactionSchema, result);
  const parsedRecurringPayments = collectParsed(
    'recurring-payments',
    archiveRows['recurring-payments'] ?? [],
    recurringPaymentSchema,
    result,
  );
  const parsedBudgets = collectParsed('budgets', archiveRows.budgets ?? [], budgetSchema, result);

  type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
  const resolve = async (tx?: Tx) => {
    const connection = tx ?? db;
    if (tx) await lockCategoryHierarchy(tx, userId);
    const categoryIds = parsedCategories.map(({value}) => value.id);
    const paymentIds = parsedPaymentMethods.map(({value}) => value.id);
    const categoryRefs = [
      ...new Set([
        ...categoryIds,
        ...parsedCategories.flatMap(({value}) => (value.parentId ? [value.parentId] : [])),
        ...[...parsedTransactions, ...parsedRecurringPayments].map(({value}) => value.categoryId),
        ...parsedBudgets.flatMap(({value}) => value.categoryIds),
      ]),
    ];
    const paymentRefs = [
      ...new Set([
        ...paymentIds,
        ...[...parsedTransactions, ...parsedRecurringPayments].map(({value}) => value.paymentMethodId),
      ]),
    ];
    // Take owner-scoped locks in table order, then in UUID order across all batches.
    const ownedCategories: Pick<typeof categories.$inferSelect, 'id' | 'parentId'>[] = [];
    for (const batch of chunked(categoryRefs.sort())) {
      const where = and(eq(categories.ownerId, userId), inArray(categories.id, batch));
      const rows = tx
        ? await tx
            .select({id: categories.id, parentId: categories.parentId})
            .from(categories)
            .where(where)
            .orderBy(categories.id)
            .for('share')
        : await db.query.categories.findMany({columns: {id: true, parentId: true}, where});
      ownedCategories.push(...rows);
    }
    const ownedPayments: Pick<typeof paymentMethods.$inferSelect, 'id'>[] = [];
    for (const batch of chunked(paymentRefs.sort())) {
      const where = and(eq(paymentMethods.ownerId, userId), inArray(paymentMethods.id, batch));
      const rows = tx
        ? await tx
            .select({id: paymentMethods.id})
            .from(paymentMethods)
            .where(where)
            .orderBy(paymentMethods.id)
            .for('share')
        : await db.query.paymentMethods.findMany({columns: {id: true}, where});
      ownedPayments.push(...rows);
    }
    // Global ID conflicts do not authorize dependencies and do not take row locks.
    const [
      existingCategoryRows,
      existingPaymentMethods,
      existingTransactions,
      existingRecurringPayments,
      existingBudgets,
    ] = await Promise.all([
      loadExistingOwners(connection.query.categories, categoryIds),
      loadExistingOwners(connection.query.paymentMethods, paymentIds),
      loadExistingOwners(
        connection.query.transactions,
        parsedTransactions.map(record => record.value.id),
      ),
      loadExistingOwners(
        connection.query.recurringPayments,
        parsedRecurringPayments.map(record => record.value.id),
      ),
      loadExistingOwners(
        connection.query.budgets,
        parsedBudgets.map(record => record.value.id),
      ),
    ]);

    const availableCategories = new Set(ownedCategories.map(row => row.id));
    const availablePaymentMethods = new Set(ownedPayments.map(row => row.id));
    const existingCategories = existingCategoryRows;
    const roots = new Set(ownedCategories.filter(row => row.parentId == null).map(row => row.id));
    for (const {value} of parsedCategories) {
      if (!value.parentId && !existingCategories.has(value.id)) roots.add(value.id);
    }

    const categoriesToCreate: TImportRecord<z.output<typeof categorySchema>>[] = [];
    for (const record of parsedCategories) {
      const owner = existingCategories.get(record.value.id);
      if (owner !== undefined) {
        if (owner === userId) {
          addResult(result, 'categories', 'skipped', {
            sourceId: record.sourceId,
            row: record.row,
            code: 'conflict',
            message: 'Category already exists and was skipped',
          });
        } else {
          addResult(result, 'categories', 'failed', {
            sourceId: record.sourceId,
            row: record.row,
            code: 'conflict',
            message: 'Category ID belongs to another user',
          });
        }
        continue;
      }
      if (record.value.parentId && !roots.has(record.value.parentId)) {
        addResult(result, 'categories', 'failed', {
          sourceId: record.sourceId,
          row: record.row,
          code: 'reference',
          message: 'Referenced parent must be an existing or imported root category owned by this user',
        });
        continue;
      }
      availableCategories.add(record.value.id);
      categoriesToCreate.push(record);
      addResult(result, 'categories', 'created', {
        sourceId: record.sourceId,
        row: record.row,
        code: 'persistence',
        message: mode === 'preview' ? 'Ready to import' : 'Imported',
      });
    }

    const paymentMethodsToCreate: TImportRecord<z.output<typeof paymentMethodSchema>>[] = [];
    for (const record of parsedPaymentMethods) {
      const owner = existingPaymentMethods.get(record.value.id);
      if (owner !== undefined) {
        if (owner === userId) {
          addResult(result, 'payment-methods', 'skipped', {
            sourceId: record.sourceId,
            row: record.row,
            code: 'conflict',
            message: 'Payment method already exists and was skipped',
          });
        } else {
          addResult(result, 'payment-methods', 'failed', {
            sourceId: record.sourceId,
            row: record.row,
            code: 'conflict',
            message: 'Payment method ID belongs to another user',
          });
        }
        continue;
      }
      availablePaymentMethods.add(record.value.id);
      paymentMethodsToCreate.push(record);
      addResult(result, 'payment-methods', 'created', {
        sourceId: record.sourceId,
        row: record.row,
        code: 'persistence',
        message: mode === 'preview' ? 'Ready to import' : 'Imported',
      });
    }

    const transactionsToCreate: TImportRecord<z.output<typeof transactionSchema>>[] = [];
    for (const record of parsedTransactions) {
      const {categoryId, paymentMethodId} = record.value;
      if (!availableCategories.has(categoryId) || !availablePaymentMethods.has(paymentMethodId)) {
        addResult(result, 'transactions', 'failed', {
          sourceId: record.sourceId,
          row: record.row,
          code: 'reference',
          message: 'Referenced category or payment method was not imported',
        });
        continue;
      }
      const owner = existingTransactions.get(record.value.id);
      if (owner !== undefined) {
        addResult(result, 'transactions', owner === userId ? 'skipped' : 'failed', {
          sourceId: record.sourceId,
          row: record.row,
          code: 'conflict',
          message:
            owner === userId
              ? 'transactions already exists and was skipped'
              : 'transactions ID belongs to another user',
        });
        continue;
      }
      transactionsToCreate.push(record);
      addResult(result, 'transactions', 'created', {
        sourceId: record.sourceId,
        row: record.row,
        code: 'persistence',
        message: mode === 'preview' ? 'Ready to import' : 'Imported',
      });
    }

    const recurringPaymentsToCreate: TImportRecord<z.output<typeof recurringPaymentSchema>>[] = [];
    for (const record of parsedRecurringPayments) {
      const {categoryId, paymentMethodId} = record.value;
      if (!availableCategories.has(categoryId) || !availablePaymentMethods.has(paymentMethodId)) {
        addResult(result, 'recurring-payments', 'failed', {
          sourceId: record.sourceId,
          row: record.row,
          code: 'reference',
          message: 'Referenced category or payment method was not imported',
        });
        continue;
      }
      const owner = existingRecurringPayments.get(record.value.id);
      if (owner !== undefined) {
        addResult(result, 'recurring-payments', owner === userId ? 'skipped' : 'failed', {
          sourceId: record.sourceId,
          row: record.row,
          code: 'conflict',
          message:
            owner === userId
              ? 'recurring-payments already exists and was skipped'
              : 'recurring-payments ID belongs to another user',
        });
        continue;
      }
      recurringPaymentsToCreate.push(record);
      addResult(result, 'recurring-payments', 'created', {
        sourceId: record.sourceId,
        row: record.row,
        code: 'persistence',
        message: mode === 'preview' ? 'Ready to import' : 'Imported',
      });
    }

    const budgetsToCreate: TImportRecord<z.output<typeof budgetSchema>>[] = [];
    for (const record of parsedBudgets) {
      if (record.value.categoryIds.some(categoryId => !availableCategories.has(categoryId))) {
        addResult(result, 'budgets', 'failed', {
          sourceId: record.sourceId,
          row: record.row,
          code: 'reference',
          message: 'One or more budget categories were not imported',
        });
        continue;
      }
      const owner = existingBudgets.get(record.value.id);
      if (owner !== undefined) {
        addResult(result, 'budgets', owner === userId ? 'skipped' : 'failed', {
          sourceId: record.sourceId,
          row: record.row,
          code: 'conflict',
          message: owner === userId ? 'Budget already exists and was skipped' : 'Budget ID belongs to another user',
        });
        continue;
      }
      budgetsToCreate.push(record);
      addResult(result, 'budgets', 'created', {
        sourceId: record.sourceId,
        row: record.row,
        code: 'persistence',
        message: mode === 'preview' ? 'Ready to import' : 'Imported',
      });
    }

    if (tx) {
      for (const children of [false, true]) {
        for (const chunk of chunked(categoriesToCreate.filter(({value}) => Boolean(value.parentId) === children))) {
          await tx.insert(categories).values(chunk.map(record => ({...record.value, ownerId: userId})));
        }
      }
      for (const chunk of chunked(paymentMethodsToCreate)) {
        await tx.insert(paymentMethods).values(chunk.map(record => ({...record.value, ownerId: userId})));
      }
      for (const chunk of chunked(transactionsToCreate)) {
        await tx.insert(transactions).values(chunk.map(record => ({...record.value, ownerId: userId})));
      }
      for (const chunk of chunked(recurringPaymentsToCreate)) {
        await tx.insert(recurringPayments).values(chunk.map(record => ({...record.value, ownerId: userId})));
      }
      for (const chunk of chunked(budgetsToCreate)) {
        await tx.insert(budgets).values(
          chunk.map(({value}) => {
            const {categoryIds: _categoryIds, ...budget} = value;
            return {...budget, ownerId: userId};
          }),
        );
        const links = chunk.flatMap(({value}) =>
          value.categoryIds.map(categoryId => ({ownerId: userId, budgetId: value.id, categoryId})),
        );
        for (const linkChunk of chunked(links)) {
          await tx.insert(budgetCategories).values(linkChunk);
        }
      }
    }
  };
  if (mode === 'commit') await db.transaction(tx => resolve(tx));
  else await resolve();
  return result;
}
