import {format, isSameYear} from 'date-fns';

export class DateFormatter {
  static formatWithPattern(date: Date | string, pattern: string = 'dd.MM.yyyy'): string {
    return format(date instanceof Date ? date : new Date(date), pattern);
  }

  static format(date: Date | string, beautiful: boolean = false): string {
    const d = date instanceof Date ? date : new Date(date);
    return DateFormatter.formatWithPattern(
      d,
      beautiful ? (isSameYear(d, new Date()) ? 'dd.MM' : 'dd.MM.yyyy') : undefined,
    );
  }

  static formatNullable(date: Date | string | null | undefined, fallback = 'Never', beautiful = false): string {
    if (!date) {
      return fallback;
    }

    return DateFormatter.format(date, beautiful);
  }
}
