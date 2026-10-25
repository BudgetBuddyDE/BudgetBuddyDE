import {format, isSameYear, startOfMonth, subMonths} from 'date-fns';
import {enUS} from 'date-fns/locale/en-US';
const locale = enUS;

export class DateFormatter {
  static asDate(value: string | null, fallback: Date) {
    if (!value) return fallback;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date;
  }

  static formatWithPattern(date: Date | string, pattern: string = 'MM/dd/yyyy'): string {
    return format(date instanceof Date ? date : new Date(date), pattern, {locale});
  }

  static format(date: Date | string, beautiful: boolean = false): string {
    const d = date instanceof Date ? date : new Date(date);
    return DateFormatter.formatWithPattern(
      d,
      beautiful ? (isSameYear(d, new Date()) ? 'MMM d' : 'MMM d, yyyy') : undefined,
    );
  }

  static formatNullable(date: Date | string | null | undefined, fallback = 'Never', beautiful = false): string {
    if (!date) {
      return fallback;
    }

    return DateFormatter.format(date, beautiful);
  }

  static startOfMonth(date: Date | string): Date {
    const d = date instanceof Date ? date : new Date(date);
    return startOfMonth(d);
  }

  static subMonths(date: Date | string, months: number): Date {
    const d = date instanceof Date ? date : new Date(date);
    return subMonths(d, months);
  }
}
