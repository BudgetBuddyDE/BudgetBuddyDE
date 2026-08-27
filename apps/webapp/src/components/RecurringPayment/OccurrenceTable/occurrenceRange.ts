import {endOfLocalMonthDateOnly, formatLocalDateOnly, parseLocalDateOnly} from '../dateOnly';

export type OccurrenceRange = {
  dateFrom: string;
  dateTo: string;
  includePaused: boolean;
};

function readDateOnly(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') return null;
  try {
    parseLocalDateOnly(value);
    return value;
  } catch {
    return null;
  }
}

export function parseOccurrenceRangeParams(
  params: Record<string, string | string[] | undefined>,
  today: Date = new Date(),
): OccurrenceRange {
  const defaultFrom = formatLocalDateOnly(today);
  const dateFrom = readDateOnly(params.dateFrom) ?? defaultFrom;
  const dateTo = readDateOnly(params.dateTo) ?? endOfLocalMonthDateOnly(today);

  return {
    dateFrom,
    dateTo: dateTo < dateFrom ? dateFrom : dateTo,
    includePaused: params.includePaused === 'true',
  };
}
