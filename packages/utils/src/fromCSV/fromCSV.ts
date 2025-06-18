export type fromCSVOptions<R = any> = Partial<{
  separator: string;
  parseValues: boolean;
  parseFunc: (value: string) => R;
}>;

export function fromCSV<R = object>(input: string, options?: fromCSVOptions<R>): R[] {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  if (input.length === 0) {
    throw new Error('Input string cannot be empty');
  }

  const separator = options?.separator || ',';
  const rows = input
    .trim()
    .split('\n')
    .map(line => line.split(separator));
  if (rows.length < 2) return [];

  const [headerRow, ...dataRows] = rows;
  const data: Record<string, ReturnType<typeof defaultTransform>> = dataRows.map(row => {
    return Object.fromEntries(
      row.map((value, index) => {
        return [
          headerRow[index],
          options?.parseValues ? (options?.parseFunc ? options.parseFunc(value) : defaultTransform(value)) : value,
        ];
      }),
    );
  });

  return data as R[];
}

function defaultTransform<T>(raw: string): any {
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw;
}
