'use client';

import {createContext, useContext} from 'react';

export const CurrencyContext = createContext<'EUR' | 'USD'>('EUR');
export const LocaleContext = createContext('en-US');

export function useCurrencyPreference(): 'EUR' | 'USD' {
  return useContext(CurrencyContext);
}

export function useLocalePreference(): string {
  return useContext(LocaleContext);
}
