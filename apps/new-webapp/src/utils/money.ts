import {getActivePreferences} from '@/preferences/preferences';

const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:[.,](\d{1,2}))?$/;

export function parseMoneyToMinorUnits(input: string): number | null {
  const normalized = input.trim();
  const match = MONEY_PATTERN.exec(normalized);
  if (!match) return null;
  const [majorPart] = normalized.split(/[.,]/);
  const minorPart = (match[1] ?? '').padEnd(2, '0');
  const cents = Number(majorPart) * 100 + Number(minorPart);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function minorUnitsToApiAmount(minorUnits: number, type: 'income' | 'expense'): number {
  if (!Number.isSafeInteger(minorUnits) || minorUnits < 0)
    throw new RangeError('Money must use non-negative integer minor units.');
  return (type === 'expense' ? -minorUnits : minorUnits) / 100;
}

export function formatCurrency(amount: number, locale?: string, currency?: string): string {
  const preferences = getActivePreferences();
  return new Intl.NumberFormat(locale ?? preferences.locale, {
    style: 'currency',
    currency: currency ?? preferences.currency,
  }).format(amount);
}
