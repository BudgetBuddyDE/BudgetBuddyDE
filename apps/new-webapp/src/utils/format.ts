const currencyFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
function activePreference(key: 'budgetbuddy-locale' | 'budgetbuddy-currency', fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

export function formatCurrency(value: number, locale?: string, currency?: string) {
  const activeLocale = locale ?? activePreference('budgetbuddy-locale', 'en-DE');
  const activeCurrency = currency ?? activePreference('budgetbuddy-currency', 'EUR');
  const key = `${activeLocale}:${activeCurrency}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency: activeCurrency,
      minimumFractionDigits: 2,
    });
    currencyFormatters.set(key, formatter);
  }
  return formatter.format(value);
}

export function formatDate(value: Date | string, locale?: string) {
  const activeLocale = locale ?? activePreference('budgetbuddy-locale', 'en-DE');
  let formatter = dateFormatters.get(activeLocale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(activeLocale, {day: '2-digit', month: 'short', year: 'numeric'});
    dateFormatters.set(activeLocale, formatter);
  }
  return formatter.format(typeof value === 'string' ? new Date(value) : value);
}

export function formatPercent(value: number, locale?: string) {
  const activeLocale = locale ?? activePreference('budgetbuddy-locale', 'en-DE');
  return new Intl.NumberFormat(activeLocale, {style: 'percent', maximumFractionDigits: 0}).format(value);
}
