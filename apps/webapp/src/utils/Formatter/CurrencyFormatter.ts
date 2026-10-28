// biome-ignore lint/complexity/noStaticOnlyClass: Justification: Utility class with static methods is fine
import {getCurrentCurrency, getCurrentLocale} from './preferenceFormat';

export class CurrencyFormatter {
  /**
   * Formats the balance amount as a currency string.
   *
   * @param balance - The balance amount to format.
   * @param currency - The currency code to use for formatting. Defaults to 'EUR'.
   * @returns The formatted balance as a string.
   */
  static formatBalance(
    balance: number,
    currency = getCurrentCurrency(),
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    locale = getCurrentLocale(),
  ): string {
    return balance.toLocaleString(locale, {
      style: 'currency',
      currency: currency ? currency : 'EUR',
      minimumFractionDigits,
      maximumFractionDigits,
    });
  }

  static formatBalanceForLocale(balance: number, currency: 'EUR' | 'USD', locale: string): string {
    return this.formatBalance(balance, currency, 2, 2, locale);
  }

  static shortenBalance(value: number, currency = getCurrentCurrency(), locale = getCurrentLocale()) {
    const absoluteValue = Math.abs(value);
    if (absoluteValue < 1_000) return this.formatBalance(value, currency, 2, 2, locale);

    const divisor = absoluteValue >= 1_000_000_000 ? 1_000_000_000 : absoluteValue >= 1_000_000 ? 1_000_000 : 1_000;
    const unit = divisor === 1_000_000_000 ? 'B' : divisor === 1_000_000 ? 'M' : 'k';
    const formattedValue = (value / divisor).toLocaleString(locale, {maximumFractionDigits: 1});
    const currencySymbol = new Intl.NumberFormat(locale, {style: 'currency', currency, maximumFractionDigits: 0})
      .formatToParts(0)
      .find(part => part.type === 'currency')?.value;
    return `${formattedValue} ${unit} ${currencySymbol ?? currency}`;
  }
}
