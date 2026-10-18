// biome-ignore lint/complexity/noStaticOnlyClass: Pure formatting utilities
export class CurrencyFormatter {
  static formatBalance(
    balance: number,
    currency = 'EUR',
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(balance);
  }

  static shortenBalance(value: number, currency = 'EUR', locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
}

export function createCurrencyFormatter(locale = 'en-US', currency = 'EUR') {
  return {
    currencySymbol:
      new Intl.NumberFormat(locale, {style: 'currency', currency})
        .formatToParts(0)
        .find(part => part.type === 'currency')?.value ?? currency,
    formatBalance: (value: number) => CurrencyFormatter.formatBalance(value, currency, locale),
    shortenBalance: (value: number) => CurrencyFormatter.shortenBalance(value, currency, locale),
  };
}
