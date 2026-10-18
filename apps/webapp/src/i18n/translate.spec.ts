import {describe, expect, it} from 'vitest';
import {englishMessages, getMessagesForLocale, type AppTranslationKey} from './messages';
import {englishTranslator} from './translate';

describe('semantic app translations', () => {
  it('uses nested semantic key paths and interpolates ICU values', () => {
    const key: AppTranslationKey = 'common.noMatchingResults';
    expect(englishTranslator(key)).toBe('No matching results');
    expect(englishTranslator('common.noResultsForQuery', {query: 'Sam'})).toBe('No results for "Sam"');
  });

  it('returns a complete nested locale catalog', async () => {
    expect(englishMessages.common.noMatchingResults).toBe('No matching results');
    expect(await getMessagesForLocale('en-US')).toBe(englishMessages);
  });

  it('loads German translations as a complete nested catalog', async () => {
    const messages = await getMessagesForLocale('de-DE');
    expect(messages.common.noMatchingResults).toBe('Keine passenden Ergebnisse');
    expect(messages.settings.dataImport.statusImported).toBe('Importiert');
  });

  it('rejects unknown semantic keys at runtime', () => {
    expect(() => englishTranslator('common.notARealKey' as AppTranslationKey)).toThrow();
  });
});
