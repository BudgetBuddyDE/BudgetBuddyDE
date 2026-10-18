// @vitest-environment node
import {NextRequest} from 'next/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {proxy} from './proxy';

const mocks = vi.hoisted(() => ({getSession: vi.fn()}));
vi.mock('./authClient', () => ({authClient: {getSession: mocks.getSession}}));
vi.mock('./logger', () => ({logger: {child: () => ({debug: vi.fn(), info: vi.fn(), error: vi.fn()})}}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({data: {user: {id: 'alice'}}, error: null});
});

describe('proxy localization routing', () => {
  it.each([
    '/sign-in',
    '/sign-up',
    '/password/request-reset',
    '/password/reset',
    '/email/changed',
    '/email/verified',
    '/user/confirm-deletion',
  ])('marks auth route %s for browser-language detection without session access', async path => {
    const response = await proxy(new NextRequest(`http://localhost${path}`));
    expect(response.headers.get('x-middleware-request-x-budgetbuddy-auth-route')).toBe('1');
    expect(response.headers.has('x-middleware-request-x-budgetbuddy-authenticated-route')).toBe(false);
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it.each(['/charts', '/dashboard', '/sign-in/unmatched', '/password/unmatched', '/api/health'])(
    'strips a spoofed auth-route marker from %s',
    async path => {
      const response = await proxy(
        new NextRequest(`http://localhost${path}`, {
          headers: {'x-budgetbuddy-auth-route': '1'},
        }),
      );
      expect(response.headers.has('x-middleware-request-x-budgetbuddy-auth-route')).toBe(false);
    },
  );

  it.each(['/sign-in', '/charts', '/unknown/path', '/unknown/page.html'])(
    'strips spoofed locale markers on public route %s without authenticating',
    async path => {
      const response = await proxy(
        new NextRequest(`http://localhost${path}`, {headers: {'x-budgetbuddy-authenticated-route': '1'}}),
      );
      expect(response.headers.has('x-middleware-request-x-budgetbuddy-authenticated-route')).toBe(false);
      expect(mocks.getSession).not.toHaveBeenCalled();
    },
  );

  it.each(['/attachments', '/recurringPayments', '/recurringPayments/occurrences'])(
    'marks dashboard route %s without expanding the existing authentication scope',
    async path => {
      const response = await proxy(new NextRequest(`http://localhost${path}`));
      expect(response.headers.get('x-middleware-request-x-budgetbuddy-authenticated-route')).toBe('1');
      expect(mocks.getSession).not.toHaveBeenCalled();
    },
  );

  it('keeps protected dashboard authentication and overwrites a client marker', async () => {
    const response = await proxy(
      new NextRequest('http://localhost/dashboard', {headers: {'x-budgetbuddy-authenticated-route': '0'}}),
    );
    expect(response.headers.get('x-middleware-request-x-budgetbuddy-authenticated-route')).toBe('1');
    expect(mocks.getSession).toHaveBeenCalledOnce();
  });

  it('retains unauthenticated redirects for existing protected routes', async () => {
    mocks.getSession.mockResolvedValue({data: null, error: null});
    const response = await proxy(new NextRequest('http://localhost/settings/profile'));
    expect(response.headers.get('location')).toBe('http://localhost/sign-in');
  });
});
