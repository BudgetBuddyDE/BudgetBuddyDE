import {createTranslator} from 'next-intl';
import {describe, expect, it} from 'vitest';
import {DEFAULT_LOCALE, getMessageKey, getMessageSource, resolveAppLocale} from './config';
import {englishMessages} from './messages';
import {createAppTranslator} from './translate';

describe('English-source translations', () => {
  it('formats every catalog entry as a valid ICU message', () => {
    const errors: unknown[] = [];
    const translator = createTranslator({
      locale: DEFAULT_LOCALE,
      messages: englishMessages,
      onError: error => errors.push(error),
    });
    for (const [key, source] of Object.entries(englishMessages)) {
      const values: Record<string, string | number> = {};
      for (const match of Array.from(source.matchAll(/\{(\w+)(?:\s*[,}])/g))) {
        values[match[1]] = /\{\w+,\s*(?:plural|selectordinal|number)/.test(match[0]) ? 2 : 'example';
      }
      translator(key, values);
    }
    expect(errors).toEqual([]);
  });

  it('encodes arbitrary source text without dots or collisions', () => {
    expect(getMessageKey('Budget.total')).not.toContain('.');
    expect(getMessageKey('Save')).not.toBe(getMessageKey('save'));
    expect(getMessageKey('a_b')).not.toBe(getMessageKey('ab'));
    for (const source of ['', 'Save', 'Budget.total', 'Hello {name}', '\u{1f4b0}']) {
      expect(getMessageSource(getMessageKey(source))).toBe(source);
    }
    expect(() => getMessageSource('unknown')).toThrow();
    expect(() => getMessageSource('m_00061')).toThrow();
  });

  it('uses catalog messages and interpolates values', () => {
    const t = createAppTranslator(
      createTranslator({
        locale: DEFAULT_LOCALE,
        messages: {[getMessageKey('Hello {name}')]: 'Welcome {name}'} as Record<string, string>,
      }),
    );
    expect(t('Hello {name}', {name: 'Sam'})).toBe('Welcome Sam');
  });

  it('formats uncatalogued source messages, including ICU plurals', () => {
    const t = createAppTranslator(createTranslator({locale: DEFAULT_LOCALE, messages: {} as Record<string, string>}));
    expect(t('Save')).toBe('Save');
    expect(t('Delete {count} transactions?', {count: 2})).toBe('Delete 2 transactions?');
    expect(t('{count, plural, one {# item} other {# items}}', {count: 1})).toBe('1 item');
    expect(t('{count, plural, one {# item} other {# items}}', {count: 3})).toBe('3 items');
  });

  it('normalizes preference locales and falls back for unsupported languages', () => {
    expect(resolveAppLocale('en_US')).toBe('en-US');
    expect(resolveAppLocale('de_DE')).toBe('en-US');
    expect(resolveAppLocale()).toBe('en-US');
  });
});
