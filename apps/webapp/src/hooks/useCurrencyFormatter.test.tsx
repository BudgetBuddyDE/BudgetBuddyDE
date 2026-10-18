import {renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {useCurrencyFormatter} from './useCurrencyFormatter';

const {useOptionalPreferencesContext} = vi.hoisted(() => ({useOptionalPreferencesContext: vi.fn()}));
vi.mock('@/components/Preferences/PreferencesProvider', () => ({useOptionalPreferencesContext}));

describe('useCurrencyFormatter', () => {
  beforeEach(() => useOptionalPreferencesContext.mockReturnValue(null));

  it('supports public pages without a preferences provider', () => {
    const {result} = renderHook(() => useCurrencyFormatter());
    expect(result.current.formatBalance(1234.5)).toBe('€1,234.50');
    expect(result.current.shortenBalance(2500)).toBe('€2.5K');
  });

  it('updates full and compact formatting when preferences change', () => {
    useOptionalPreferencesContext.mockReturnValue({locale: 'en-US', effectivePreferences: {currency: 'USD'}});
    const {result, rerender} = renderHook(() => useCurrencyFormatter());
    const original = result.current;
    rerender();
    expect(result.current).toBe(original);
    expect(result.current.formatBalance(1234.5)).toBe('$1,234.50');
    useOptionalPreferencesContext.mockReturnValue({locale: 'de-DE', effectivePreferences: {currency: 'EUR'}});
    rerender();
    expect(result.current.formatBalance(1234.5)).toBe(
      new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(1234.5),
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
