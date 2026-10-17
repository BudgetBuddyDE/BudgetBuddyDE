/** Date-only values use local calendar dates, matching date pickers and API query serialization. */
export function formatLocalDateOnly(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new RangeError(`Invalid date-only value: ${value}`);

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (formatLocalDateOnly(date) !== value) throw new RangeError(`Invalid date-only value: ${value}`);
  return date;
}

export function tryParseLocalDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    return parseLocalDateOnly(value);
  } catch {
    return null;
  }
}
