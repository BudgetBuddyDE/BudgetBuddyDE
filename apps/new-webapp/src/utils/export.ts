function csvValue(value: unknown) {
  const normalized =
    value instanceof Date ? value.toISOString() : Array.isArray(value) ? value.join('; ') : (value ?? '');
  return `"${String(normalized).replaceAll('"', '""')}"`;
}

export function serializeRecordsCsv(records: readonly object[]) {
  if (records.length === 0) return '';
  const columns = [...new Set(records.flatMap(record => Object.keys(record)))];
  const rows = records.map(record => columns.map(key => csvValue((record as Record<string, unknown>)[key])).join(','));
  return [columns.map(csvValue).join(','), ...rows].join('\n');
}

export function serializeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function downloadTextFile(content: string, type: string, filename: string) {
  const href = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}
