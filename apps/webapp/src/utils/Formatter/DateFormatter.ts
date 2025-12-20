import {format, isSameYear} from 'date-fns';

export class DateFormatter {
  static months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'Juli',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  months = DateFormatter.months;

  /**
   * @deprecated Use Formatter.formatDate().getMonthFromDate() instead.
   */
  static getMonthFromDate(date: Date = new Date()) {
    return DateFormatter.months[date.getMonth()];
  }

  getMonthFromDate(date: Date = new Date()) {
    return DateFormatter.getMonthFromDate(date);
  }

  /**
   * @deprecated Use Formatter.formatDate().shortMonthName() instead.
   */
  static shortMonthName(date: Date = new Date(), maxLength = 3) {
    return DateFormatter.getMonthFromDate(date).substring(0, maxLength);
  }

  shortMonthName(date: Date = new Date(), maxLength = 3) {
    return DateFormatter.shortMonthName(date, maxLength);
  }

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
}
