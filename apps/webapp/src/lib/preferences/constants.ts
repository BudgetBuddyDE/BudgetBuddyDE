// TODO: Move these constants to a shared options module when more currencies, languages, or time zones are supported.
export const DEFAULT_PREFERENCES = {
  language: 'en_US',
  currency: 'EUR',
  timeZone: 'Europe/Berlin',
} as const;

export const LANGUAGE_OPTIONS = [{value: 'en_US', label: 'English (United States)'}] as const;
export const CURRENCY_OPTIONS = [
  {value: 'EUR', label: 'Euro (EUR)'},
  {value: 'USD', label: 'US Dollar (USD)'},
] as const;
export const TIME_ZONE_OPTIONS = [{value: 'Europe/Berlin', label: 'Europe/Berlin'}] as const;
