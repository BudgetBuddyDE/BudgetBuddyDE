/**
 * Converts the given decimal number value to a number.
 * E.g. 123,32 => 123.32 or -123,32 => -123.32
 *
 * @param balance - The balance value as a string
 * @returns The number representing the balance value
 */
export function parseNumber(balance: string): number {
  return Number(balance.replace(',', '.'));
}
