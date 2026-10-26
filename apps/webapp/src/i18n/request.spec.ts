import {beforeEach, describe, expect, it, vi} from 'vite-plus/test';

const {cookies, headers, preferenceGet} = vi.hoisted(() => ({
  cookies: vi.fn(),
  headers: vi.fn(),
  preferenceGet: vi.fn(),
}));

vi.mock('next/headers', () => ({cookies, headers}));
vi.mock('next-intl/server', () => ({
  getRequestConfig: (configure: unknown) => configure,
}));
vi.mock('@/apiClient', () => ({apiClient: {backend: {preference: {get: preferenceGet}}}}));

import {createRequestConfig, resolveRequestLocale} from './request';

describe('request locale selection', () => {
  beforeEach(() => {
    cookies.mockResolvedValue({get: vi.fn(() => undefined)});
    headers.mockResolvedValue(new Headers());
    preferenceGet.mockResolvedValue([null, new Error('Not authenticated')]);
  });

  it('uses a valid user preference before cookie and browser language', async () => {
    preferenceGet.mockResolvedValueOnce([{data: {language: 'de_DE'}}, null]);
    cookies.mockResolvedValueOnce({get: vi.fn(() => ({value: 'en-US'}))});
    headers.mockResolvedValueOnce(new Headers({'accept-language': 'en-US', cookie: 'session=abc'}));

    const requestResult = await createRequestConfig();

    expect(requestResult.locale).toBe('de-DE');
    expect(requestResult.messages).toHaveProperty('Preferences.languageGerman');
    expect(preferenceGet).toHaveBeenCalledWith({headers: {cookie: 'session=abc'}, cache: 'no-store'});
  });

  it('uses the cookie when preferences are unavailable', async () => {
    cookies.mockResolvedValueOnce({get: vi.fn(() => ({value: 'de-DE'}))});
    headers.mockResolvedValueOnce(new Headers({'accept-language': 'en-US'}));

    const requestResult = await createRequestConfig();

    expect(requestResult.locale).toBe('de-DE');
    expect(preferenceGet).not.toHaveBeenCalled();
  });

  it('uses browser language when preferences and cookie are unavailable', async () => {
    headers.mockResolvedValueOnce(new Headers({'accept-language': 'de-AT,de;q=0.9,en-US;q=0.8'}));

    const requestResult = await createRequestConfig();

    expect(requestResult.locale).toBe('de-DE');
  });

  it('uses the default locale if all available languages are unsupported', async () => {
    headers.mockResolvedValueOnce(new Headers({'accept-language': 'fr-FR,es-ES'}));

    const requestResult = await createRequestConfig();

    expect(requestResult.locale).toBe('en-US');
  });

  it('falls back to the default locale when a configured locale is unsupported', async () => {
    await expect(resolveRequestLocale({preferenceLanguage: 'fr-FR', cookieLocale: 'de-DE'})).resolves.toBe('en-US');
    await expect(resolveRequestLocale({cookieLocale: 'fr-FR', acceptLanguage: 'de-DE'})).resolves.toBe('en-US');
  });

  it('does not query preferences without a session cookie', async () => {
    headers.mockResolvedValueOnce(new Headers({'accept-language': 'de-DE'}));

    const requestResult = await createRequestConfig();

    expect(requestResult.locale).toBe('de-DE');
    expect(preferenceGet).not.toHaveBeenCalled();
  });
});
