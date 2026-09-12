// biome-ignore lint/complexity/noStaticOnlyClass: Justification: Utility class with static methods is fine
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
    currency?: string,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  ): string {
    return balance.toLocaleString('de-DE', {
      style: 'currency',
      currency: currency ? currency : 'EUR',
      minimumFractionDigits,
      maximumFractionDigits,
    });
  }
}
