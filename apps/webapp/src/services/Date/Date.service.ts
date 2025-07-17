import {format, isSameYear} from 'date-fns';

export class DateService {
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
  months = DateService.months;

  /**
   * @deprecated Use Formatter.formatDate().getMonthFromDate() instead.
   */
  static getMonthFromDate(date: Date = new Date()) {
    return this.months[date.getMonth()];
  }

  getMonthFromDate(date: Date = new Date()) {
    return DateService.getMonthFromDate(date);
  }

  /**
   * @deprecated Use Formatter.formatDate().shortMonthName() instead.
   */
  static shortMonthName(date: Date = new Date(), maxLength = 3) {
    return this.getMonthFromDate(date).substring(0, maxLength);
  }

  shortMonthName(date: Date = new Date(), maxLength = 3) {
    return DateService.shortMonthName(date, maxLength);
  }

  static format(date: Date | string, pattern: string = 'dd.MM.yyyy'): string {
    return format(date instanceof Date ? date : new Date(date), pattern);
  }

  format(date: Date | string, beautiful: boolean = false): string {
    const d = date instanceof Date ? date : new Date(date);
    return DateService.format(d, beautiful ? (isSameYear(d, new Date()) ? 'dd.MM' : 'dd.MM.yyyy') : undefined);
  }
}
