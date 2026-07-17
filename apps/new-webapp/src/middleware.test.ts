import {NextRequest} from 'next/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';
const getSession = vi.hoisted(() => vi.fn());
vi.mock('./authClient', () => ({authClient: {getSession}}));
import {middleware} from './middleware';

describe('authentication middleware', () => {
  beforeEach(() => vi.clearAllMocks());
  it('allows requests with a valid session', async () => {
    getSession.mockResolvedValue({data: {user: {id: 'u'}}, error: null});
    const response = await middleware(new NextRequest('http://localhost/dashboard'));
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
  it('fails closed to sign in when the auth service is unavailable', async () => {
    getSession.mockRejectedValue(new TypeError('fetch failed'));
    const response = await middleware(new NextRequest('http://localhost/dashboard'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/sign-in');
  });
});
