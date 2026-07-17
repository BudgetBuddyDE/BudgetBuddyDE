'use client';

import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {englishMessages, germanMessages} from '@/lib/messages';

export type AppLocale = 'en-DE' | 'en-US' | 'de-DE';
export type AppCurrency = 'EUR' | 'USD' | 'GBP' | 'CHF';
export type MessageValues = Record<string, string | number>;
export type MessageCatalog = Record<string, string>;
export type MessageFormatter = (key: string, values?: MessageValues) => string;

const ENGLISH: MessageCatalog = {...englishMessages};
const GERMAN: MessageCatalog = {...germanMessages};
const CATALOGS: Record<'en' | 'de', MessageCatalog> = {en: ENGLISH, de: GERMAN};

interface I18nContextValue {
  locale: AppLocale;
  currency: AppCurrency;
  setLocale: (locale: AppLocale) => void;
  setCurrency: (currency: AppCurrency) => void;
  t: MessageFormatter;
  formatCurrency: (value: number) => string;
  formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en-DE',
  currency: 'EUR',
  setLocale: () => undefined,
  setCurrency: () => undefined,
  t: (key, values) => interpolate(ENGLISH[key] ?? key, values),
  formatCurrency: value =>
    new Intl.NumberFormat('en-DE', {style: 'currency', currency: 'EUR', minimumFractionDigits: 2}).format(value),
  formatDate: (value, options = {day: '2-digit', month: 'short', year: 'numeric'}) =>
    new Intl.DateTimeFormat('en-DE', options).format(typeof value === 'string' ? new Date(value) : value),
  formatNumber: (value, options) => new Intl.NumberFormat('en-DE', options).format(value),
  formatPercent: value => new Intl.NumberFormat('en-DE', {style: 'percent', maximumFractionDigits: 0}).format(value),
});

function storedLocale(): AppLocale {
  const saved = window.localStorage.getItem('budgetbuddy-locale');
  return saved === 'en-US' || saved === 'de-DE' || saved === 'en-DE' ? saved : 'en-DE';
}

function storedCurrency(): AppCurrency {
  const saved = window.localStorage.getItem('budgetbuddy-currency');
  return saved === 'USD' || saved === 'GBP' || saved === 'CHF' || saved === 'EUR' ? saved : 'EUR';
}

function interpolate(message: string, values?: MessageValues) {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (token, name: string) => String(values[name] ?? token));
}

export function registerCatalog(language: 'en' | 'de', messages: MessageCatalog) {
  Object.assign(CATALOGS[language], messages);
}

export function I18nProvider({children}: {children: React.ReactNode}) {
  const [locale, setLocaleState] = useState<AppLocale>('en-DE');
  const [currency, setCurrencyState] = useState<AppCurrency>('EUR');

  useEffect(() => {
    setLocaleState(storedLocale());
    setCurrencyState(storedCurrency());
  }, []);

  const setLocale = (next: AppLocale) => {
    setLocaleState(next);
    document.documentElement.lang = next.split('-')[0] ?? 'en';
    window.localStorage.setItem('budgetbuddy-locale', next);
  };
  const setCurrency = (next: AppCurrency) => {
    setCurrencyState(next);
    window.localStorage.setItem('budgetbuddy-currency', next);
  };
  const language = locale.startsWith('de') ? 'de' : 'en';
  const t = (key: string, values?: MessageValues) => {
    const message = CATALOGS[language][key] ?? ENGLISH[key];
    if (message) return interpolate(message, values);
    return process.env.NODE_ENV === 'production' ? key : `[missing translation: ${key}]`;
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      currency,
      setLocale,
      setCurrency,
      t,
      formatCurrency: amount =>
        new Intl.NumberFormat(locale, {style: 'currency', currency, minimumFractionDigits: 2}).format(amount),
      formatDate: (date, options = {day: '2-digit', month: 'short', year: 'numeric'}) =>
        new Intl.DateTimeFormat(locale, options).format(typeof date === 'string' ? new Date(date) : date),
      formatNumber: (number, options) => new Intl.NumberFormat(locale, options).format(number),
      formatPercent: number =>
        new Intl.NumberFormat(locale, {style: 'percent', maximumFractionDigits: 0}).format(number),
    }),
    [currency, language, locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
