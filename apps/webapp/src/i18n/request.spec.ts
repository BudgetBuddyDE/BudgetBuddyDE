// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest';
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
  it('keeps public requests English without validating a session or fetching preferences', async () => {
    expect(await resolveConfig()).toMatchObject({locale: 'en-US', timeZone: 'UTC'});
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

    expect(await resolveConfig()).toMatchObject({locale: 'de-DE'});
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
