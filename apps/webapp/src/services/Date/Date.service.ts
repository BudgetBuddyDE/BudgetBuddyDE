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
}
