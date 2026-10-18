'use client';

import {useMemo} from 'react';
import {useOptionalPreferencesContext} from '@/components/Preferences/PreferencesProvider';
import {createCurrencyFormatter} from '@/utils/Formatter/CurrencyFormatter';

/** Public pages without a preferences provider use the application defaults. */
export function useCurrencyFormatter() {
  const preferences = useOptionalPreferencesContext();
  const locale = preferences?.locale ?? 'en-US';
  const currency = preferences?.effectivePreferences.currency ?? 'EUR';
  return useMemo(() => createCurrencyFormatter(locale, currency), [locale, currency]);
}
