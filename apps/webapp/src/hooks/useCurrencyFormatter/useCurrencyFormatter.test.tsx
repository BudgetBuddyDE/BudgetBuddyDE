import {renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {useCurrencyFormatter} from '../useCurrencyFormatter';

const {useOptionalPreferencesContext} = vi.hoisted(() => ({useOptionalPreferencesContext: vi.fn()}));
vi.mock('@/components/Preferences/PreferencesProvider', () => ({useOptionalPreferencesContext}));

describe('useCurrencyFormatter', () => {
  beforeEach(() => useOptionalPreferencesContext.mockReturnValue(null));

  it('supports public pages without a preferences provider', () => {
    const {result} = renderHook(() => useCurrencyFormatter());
    expect(result.current.formatBalance(1234.5)).toBe('€1,234.50');
    expect(result.current.shortenBalance(2500)).toBe('€2.5K');
    expect(result.current.currencySymbol).toBe('€');
  });

  it.each(['en-US', 'de-DE'])('updates the symbol and preserves the amount when currency changes in %s', locale => {
    useOptionalPreferencesContext.mockReturnValue({locale, effectivePreferences: {currency: 'EUR'}});
    const {result, rerender} = renderHook(() => useCurrencyFormatter());
    const original = result.current;
    const amount = 1234.5;
    const euroFormat = new Intl.NumberFormat(locale, {style: 'currency', currency: 'EUR'});
    const dollarFormat = new Intl.NumberFormat(locale, {style: 'currency', currency: 'USD'});
    const euroSymbol = euroFormat.formatToParts(amount).find(part => part.type === 'currency')?.value;
    const dollarSymbol = dollarFormat.formatToParts(amount).find(part => part.type === 'currency')?.value;

    expect(result.current.currencySymbol).toBe(euroSymbol);
    expect(result.current.formatBalance(amount)).toBe(euroFormat.format(amount));

    useOptionalPreferencesContext.mockReturnValue({locale, effectivePreferences: {currency: 'USD'}});
    rerender();

    expect(result.current.currencySymbol).toBe(dollarSymbol);
    expect(result.current.currencySymbol).not.toBe('&euro;');
    expect(result.current.formatBalance(amount)).toBe(dollarFormat.format(amount));
    expect(original.currencySymbol).toBe(euroSymbol);
    expect(original.formatBalance(amount)).toBe(euroFormat.format(amount));
  });

  it('updates full and compact formatting when preferences change', () => {
    useOptionalPreferencesContext.mockReturnValue({locale: 'en-US', effectivePreferences: {currency: 'USD'}});
    const {result, rerender} = renderHook(() => useCurrencyFormatter());
    const original = result.current;
    rerender();
    expect(result.current).toBe(original);
    expect(result.current.formatBalance(1234.5)).toBe('$1,234.50');
    expect(result.current.currencySymbol).toBe(
      new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'})
        .formatToParts(0)
        .find(part => part.type === 'currency')?.value,
    );
    useOptionalPreferencesContext.mockReturnValue({locale: 'de-DE', effectivePreferences: {currency: 'EUR'}});
    rerender();
    expect(result.current.formatBalance(1234.5)).toBe(
      new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(1234.5),
    );
    expect(result.current.currencySymbol).toBe(
      new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'})
        .formatToParts(0)
        .find(part => part.type === 'currency')?.value,
    );
    expect(result.current.shortenBalance(2500)).toBe(
      new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(2500),
    );
    expect(original.formatBalance(1234.5)).toBe('$1,234.50');
  });
});
