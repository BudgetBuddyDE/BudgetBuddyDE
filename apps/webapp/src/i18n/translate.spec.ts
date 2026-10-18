import {createTranslator} from 'next-intl';
import {describe, expect, it} from 'vitest';
import {englishMessages, getMessagesForLocale, type AppTranslationKey} from './messages';
import {createAppTranslator, englishTranslator} from './translate';

function expectPlainMessageTree(value: unknown, path: string) {
  if (typeof value === 'string') return;

  expect(value, path).not.toBeNull();
  expect(typeof value, path).toBe('object');
  expect(Object.getPrototypeOf(value), path).toBe(Object.prototype);
  expect(Object.getOwnPropertySymbols(value), path).toEqual([]);
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    expectPlainMessageTree(child, `${path}.${key}`);
  }
}

describe('semantic app translations', () => {
  it('uses nested semantic key paths and interpolates ICU values', () => {
    const key: AppTranslationKey = 'common.noMatchingResults';
    expect(englishTranslator(key)).toBe('No matching results');
    expect(englishTranslator('common.noResultsForQuery', {query: 'Sam'})).toBe('No results for "Sam"');
  });

  it('returns a complete nested locale catalog synchronously', () => {
    expect(englishMessages.common.noMatchingResults).toBe('No matching results');
    expect(getMessagesForLocale('en-US')).toBe(englishMessages);
  });

  it('loads German translations as a complete nested catalog synchronously', () => {
    const messages = getMessagesForLocale('de-DE');
    expect(messages.common.noMatchingResults).toBe('Keine passenden Ergebnisse');
    expect(messages.settings.dataImport.statusImported).toBe('Importiert');
  });

  it.each(['en-US', 'de-DE'])('provides only plain serializable message objects for %s', locale => {
    const messages = getMessagesForLocale(locale);
    expectPlainMessageTree(messages, locale);
    expect(JSON.parse(JSON.stringify(messages))).toEqual(messages);
  });

  it.each([
    ['en-US', ['Ooops!', 'Upcoming recurring payments', 'Transactions']],
    ['de-DE', ['Hoppla!', 'Anstehende wiederkehrende Zahlungen', 'Transaktionen']],
  ] as const)('resolves the affected semantic keys in %s', (locale, expected) => {
    const translator = createAppTranslator(
      createTranslator({locale, messages: getMessagesForLocale(locale), timeZone: 'UTC'}) as Parameters<
        typeof createAppTranslator
      >[0],
    );

    expect(translator('errors.oops')).toBe(expected[0]);
    expect(translator('recurringPayments.upcomingRecurringPayments')).toBe(expected[1]);
    expect(translator('transactions.transactionsMessage')).toBe(expected[2]);
  });

  it('rejects unknown semantic keys at runtime', () => {
    expect(() => englishTranslator('common.notARealKey' as AppTranslationKey)).toThrow();
  });
});
