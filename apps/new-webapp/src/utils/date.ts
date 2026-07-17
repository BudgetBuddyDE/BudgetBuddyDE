import {getActivePreferences} from '@/preferences/preferences';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseLocalDate(input: string): Date | null {
  const match = DATE_PATTERN.exec(input);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function toDateInputValue(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftMonth(period: string, offset: number): string {
  const [year, month] = period.split('-').map(Number);
  return toDateInputValue(new Date(year, month - 1 + offset, 1)).slice(0, 7);
}

export function formatPeriodLabel(period: string, locale?: string): string {
  const [year, month] = period.split('-').map(Number);
  const preferences = getActivePreferences();
  return new Intl.DateTimeFormat(locale ?? preferences.locale, {
    month: 'long',
    year: 'numeric',
    timeZone: preferences.timeZone,
  }).format(new Date(year, month - 1, 1));
}

export function formatDate(value: Date | string, locale?: string): string {
  const preferences = getActivePreferences();
  return new Intl.DateTimeFormat(locale ?? preferences.locale, {
    dateStyle: 'medium',
    timeZone: preferences.timeZone,
  }).format(typeof value === 'string' ? new Date(value) : value);
}
