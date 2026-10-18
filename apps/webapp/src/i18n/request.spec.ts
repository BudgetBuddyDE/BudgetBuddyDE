// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {getMessagesForLocale} from './messages';
import getConfig from './request';

const mocks = vi.hoisted(() => ({headers: vi.fn(), getSession: vi.fn(), getPreferences: vi.fn()}));
vi.mock('@/lib/headers', () => ({headers: mocks.headers}));
vi.mock('@/authClient', () => ({authClient: {getSession: mocks.getSession}}));
vi.mock('next-intl/server', () => ({getRequestConfig: (callback: unknown) => callback}));
vi.mock('@/lib/preferences/getPreferences', () => ({getPreferences: mocks.getPreferences}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(new Headers());
  mocks.getSession.mockResolvedValue({data: null, error: null});
  mocks.getPreferences.mockResolvedValue([{data: {language: 'de_DE'}}, null]);
});

const resolveConfig = () => getConfig({requestLocale: Promise.resolve(undefined)});

describe('request localization', () => {
  it.each([
    ['de-DE,de;q=0.9,en;q=0.8', 'de-DE', 'Hoppla!'],
    ['de-AT', 'de-DE', 'Hoppla!'],
    ['fr-FR,en-GB;q=0.8', 'en-US', 'Ooops!'],
    ['fr-FR', 'en-US', 'Ooops!'],
  ])('uses the supported browser language for auth pages: %s', async (language, locale, text) => {
    mocks.headers.mockResolvedValue(new Headers({'x-budgetbuddy-auth-route': '1', 'accept-language': language}));
    mocks.getSession.mockResolvedValue({data: {user: {id: 'user-1'}}, error: null});
    const config = await resolveConfig();
    expect(config).toMatchObject({locale, messages: {errors: {oops: text}}});
    expect(config.messages).not.toBeInstanceOf(Promise);
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.getPreferences).not.toHaveBeenCalled();
  });

  it('prefers saved dashboard language over the browser language', async () => {
    mocks.headers.mockResolvedValue(
      new Headers({'x-budgetbuddy-authenticated-route': '1', 'accept-language': 'de-DE'}),
    );
    mocks.getSession.mockResolvedValue({data: {user: {id: 'user-1'}}, error: null});
    mocks.getPreferences.mockResolvedValue([{data: {language: 'en_US'}}, null]);
    expect(await resolveConfig()).toMatchObject({locale: 'en-US'});
  });

  it('keeps public requests English without validating a session or fetching preferences', async () => {
    const config = await resolveConfig();
    expect(config).toMatchObject({locale: 'en-US', timeZone: 'UTC'});
    expect(config.messages).not.toBeInstanceOf(Promise);
    expect(config.messages).toBe(getMessagesForLocale('en-US'));
    expect(config.messages).toMatchObject({errors: {oops: 'Ooops!'}});
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.getPreferences).not.toHaveBeenCalled();
  });

  it('does not fetch preferences for marked requests without a valid session', async () => {
    mocks.headers.mockResolvedValue(new Headers({'x-budgetbuddy-authenticated-route': '1'}));
    expect(await resolveConfig()).toMatchObject({locale: 'en-US'});
    expect(mocks.getSession).toHaveBeenCalledOnce();
    expect(mocks.getPreferences).not.toHaveBeenCalled();
  });

  it('resolves German preferences after validating a session on a marked public domain route', async () => {
    const requestHeaders = new Headers({
      'x-budgetbuddy-authenticated-route': '1',
      cookie: 'budget-buddy.session_token=token',
    });
    mocks.headers.mockResolvedValue(requestHeaders);
    mocks.getSession.mockResolvedValue({data: {user: {id: 'user-1'}}, error: null});

    const config = await resolveConfig();
    expect(config).toMatchObject({locale: 'de-DE'});
    expect(config.messages).not.toBeInstanceOf(Promise);
    expect(config.messages).toBe(getMessagesForLocale('de-DE'));
    expect(config.messages).toMatchObject({errors: {oops: 'Hoppla!'}});
    expect(mocks.getSession).toHaveBeenCalledWith({fetchOptions: {headers: requestHeaders}});
    expect(mocks.getPreferences).toHaveBeenCalledOnce();
  });

  it.each([
    ['forged', 'budget-buddy.session_token=forged', {data: null, error: null}],
    ['expired', '__Secure-budget-buddy.session_token=expired', {data: null, error: {status: 401}}],
  ])('does not fetch preferences for a %s session cookie', async (_name, cookie, session) => {
    mocks.headers.mockResolvedValue(new Headers({'x-budgetbuddy-authenticated-route': '1', cookie: cookie as string}));
    mocks.getSession.mockResolvedValue(session);
    expect(await resolveConfig()).toMatchObject({locale: 'en-US'});
    expect(mocks.getPreferences).not.toHaveBeenCalled();
  });
});
