export const TABLE_PAGE_SIZES = [10, 25, 50, 100] as const;
export type TablePageSize = (typeof TABLE_PAGE_SIZES)[number];
export const DEFAULT_TABLE_PAGE_SIZE: TablePageSize = 10;

export function parsePageSize(value: string | null): TablePageSize {
  const parsed = Number(value);
  return TABLE_PAGE_SIZES.includes(parsed as TablePageSize) ? (parsed as TablePageSize) : DEFAULT_TABLE_PAGE_SIZE;
}

export function parseMultiValue(searchParams: URLSearchParams, key: string) {
  return searchParams
    .getAll(key)
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
}

export function updateTableSearchParams(
  current: URLSearchParams,
  changes: Record<string, string | readonly string[] | null>,
) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    next.delete(key);
    if (typeof value === 'string') {
      if (value) next.set(key, value);
    } else if (value) {
      for (const item of value) if (item) next.append(key, item);
    }
  }
  return next;
}
