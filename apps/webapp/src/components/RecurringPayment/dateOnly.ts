import {formatLocalDateOnly, parseLocalDateOnly} from '@/utils/dateOnly';
import {DateFormatter} from '@/utils/Formatter/DateFormatter';

export {formatLocalDateOnly, parseLocalDateOnly};

export function formatDateOnlyForDisplay(value: string): string {
  const date = parseLocalDateOnly(value);
  return DateFormatter.formatWithPattern(date);
}

export function endOfLocalMonthDateOnly(date: Date): string {
  return formatLocalDateOnly(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}
