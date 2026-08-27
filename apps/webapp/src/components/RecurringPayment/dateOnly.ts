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

export function formatDateOnlyForDisplay(value: string): string {
  const date = parseLocalDateOnly(value);
  return new Intl.DateTimeFormat('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'}).format(date);
}

export function endOfLocalMonthDateOnly(date: Date): string {
  return formatLocalDateOnly(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}
