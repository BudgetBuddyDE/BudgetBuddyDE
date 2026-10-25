export function getCurrentCurrency(): 'EUR' | 'USD' {
  if (typeof document === 'undefined') return 'EUR';
  return document.documentElement.dataset.currency === 'USD' ? 'USD' : 'EUR';
}

export function getCurrentLocale(): string {
  if (typeof document === 'undefined') return 'en-US';
  return document.documentElement.lang || 'en-US';
}

export function setCurrentCurrency(currency: 'EUR' | 'USD') {
  if (typeof window === 'undefined') return;
  document.cookie = `budgetbuddy-currency=${currency}; Path=/; SameSite=Lax; Max-Age=31536000`;
  document.documentElement.dataset.currency = currency;
  window.dispatchEvent(new CustomEvent('budgetbuddy-currency-change', {detail: currency}));
}

export function setCurrentLocale(locale: 'en-US' | 'de-DE') {
  if (typeof window === 'undefined') return;
  document.cookie = `budgetbuddy-locale=${locale}; Path=/; SameSite=Lax; Max-Age=31536000`;
  document.documentElement.lang = locale;
  window.dispatchEvent(new CustomEvent('budgetbuddy-locale-change', {detail: locale}));
}
