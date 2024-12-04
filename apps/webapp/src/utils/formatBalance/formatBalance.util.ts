/**
 * // TODO: Get language and currency from browser-settings(current location?)
 * @deprecated Use Formatter.formatBalance instead
 */
export function formatBalance(balance: number, currency = 'EUR'): string {
  return balance.toLocaleString('de-DE', {style: 'currency', currency: currency});
}
