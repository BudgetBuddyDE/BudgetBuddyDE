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

  static shortenBalance(value: number) {
    const absoluteValue = Math.abs(value);
    if (absoluteValue < 1_000) return this.formatBalance(value);

    const divisor = absoluteValue >= 1_000_000_000 ? 1_000_000_000 : absoluteValue >= 1_000_000 ? 1_000_000 : 1_000;
    const unit = divisor === 1_000_000_000 ? 'B' : divisor === 1_000_000 ? 'M' : 'k';
    const formattedValue = (value / divisor).toLocaleString('de-DE', {maximumFractionDigits: 1});
    return `${formattedValue} ${unit} €`;
  }
}
