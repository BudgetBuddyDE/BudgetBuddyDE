import {toCSV, type FieldsWithAlias} from '@budgetbuddyde/utils';
import type {ExportableRecord, ExportFormat, ExportResult} from './types';

function normalizeValue(value: unknown): string | number | boolean | null {
  if (value instanceof Date) return value.toISOString();
  if (value === undefined) return null;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return JSON.stringify(value);
}

function normalizeRecord<T extends object>(record: T): ExportableRecord {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, normalizeValue(value)]));
}

function recordsToCSV(records: ExportableRecord[]) {
  if (records.length === 0) return '';
  const fields = Object.keys(records[0] ?? {}).map(field => ({
    field,
    transform: (value: ExportableRecord[keyof ExportableRecord]) => normalizeValue(value),
  })) as FieldsWithAlias<ExportableRecord>;
  return toCSV(records.map(normalizeRecord), fields);
}

export function serializeExport(result: ExportResult, format: ExportFormat) {
  if (format === 'json') return `${JSON.stringify(result, null, 2)}\n`;

  return Object.entries(result)
    .map(([entity, records]) => [`# ${entity}`, recordsToCSV(records ?? [])].filter(Boolean).join('\n'))
    .join('\n\n');
}
