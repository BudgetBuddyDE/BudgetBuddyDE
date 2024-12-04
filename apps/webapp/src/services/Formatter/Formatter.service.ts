import {DateService} from '../Date';

export class Formatter {
  /**
   * Formats the balance amount as a currency string.
   *
   * @param balance - The balance amount to format.
   * @param currency - The currency code to use for formatting. Defaults to 'EUR'.
   * @returns The formatted balance as a string.
   */
  static formatBalance(balance: number, currency = 'EUR'): string {
    return balance.toLocaleString('de-DE', {style: 'currency', currency: currency});
  }

  /**
   * Formats a number by shortening it with appropriate suffixes (Mio., Mrd., K.).
   * @param number - The number to be formatted.
   * @returns The formatted number as a string.
   */
  static shortenNumber(number: number): string {
    let isNegative = number < 0;
    let formattedVal: number | string = Math.abs(number);
    if (formattedVal >= 1000000000) {
      formattedVal = (formattedVal / 1000000000).toFixed(2) + ' Mrd.';
    } else if (formattedVal >= 1000000) {
      formattedVal = (formattedVal / 1000000).toFixed(2) + ' Mio.';
    } else if (formattedVal >= 1000) {
      formattedVal = (formattedVal / 1000).toFixed(2) + ' K.';
    }

    return isNegative ? '-' + formattedVal : formattedVal.toString();
  }

  static formatDate() {
    return new DateService();
  }
}
