export type ExportFormat = 'csv' | 'json';

export interface ExportColumn<T> {
  key: string;
  header: string;
  value: (row: T) => string | number | boolean | null;
}

export interface JsonExport {
  version: 1;
  entity: string;
  exportedAt: string;
  records: Array<Record<string, string | number | boolean | null>>;
}

function csvCell(value: string | number | boolean | null) {
  if (value === null) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toExportRecords<T>(rows: readonly T[], columns: readonly ExportColumn<T>[]) {
  return rows.map(row => Object.fromEntries(columns.map(column => [column.key, column.value(row)])));
}

export function createCsv<T>(rows: readonly T[], columns: readonly ExportColumn<T>[]) {
  const lines = [columns.map(column => csvCell(column.header)).join(',')];
  for (const row of rows) lines.push(columns.map(column => csvCell(column.value(row))).join(','));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function createJson<T>(
  entity: string,
  rows: readonly T[],
  columns: readonly ExportColumn<T>[],
  exportedAt = new Date(),
) {
  const payload: JsonExport = {
    version: 1,
    entity,
    exportedAt: exportedAt.toISOString(),
    records: toExportRecords(rows, columns),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function exportFileName(entity: string, format: ExportFormat, date = new Date()) {
  return `budgetbuddy-${entity}-${date.toISOString().slice(0, 10)}.${format}`;
}

export function downloadExport(content: string, fileName: string, format: ExportFormat) {
  const type = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';
  const href = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(href);
}
