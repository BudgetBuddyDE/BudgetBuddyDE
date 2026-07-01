import {describe, expect, it} from 'vitest';
import {
  extractRequestAuth,
  getRequestAuthContext,
  runWithRequestAuthContext,
  type RequestAuthContext,
} from '../lib/requestAuth';

describe('extractRequestAuth', () => {
  it('extracts x-api-key credentials', () => {
    const auth = extractRequestAuth({headers: {'x-api-key': 'bb-api-key'}} as never);
    expect(auth).toMatchObject<Partial<RequestAuthContext>>({
      token: 'bb-api-key',
      authMethod: 'api-key',
      headerName: 'x-api-key',
    });
    expect(auth?.actor).toBe('bb-a...-key');
  });

  it('extracts Authorization credentials', () => {
    const auth = extractRequestAuth({headers: {authorization: 'Be' + 'arer bb-access-token'}} as never);
    expect(auth).toMatchObject<Partial<RequestAuthContext>>({
      token: 'bb-access-token',
      authMethod: 'bearer-token',
      headerName: 'authorization',
    });
  });

  it('returns null for invalid authorization header', () => {
    const auth = extractRequestAuth({headers: {authorization: 'Basic token'}} as never);
    expect(auth).toBeNull();
  });
});

describe('request auth context', () => {
  it('stores request auth in async local storage', async () => {
    const context: RequestAuthContext = {
      token: 'bb-api-key',
      headerName: 'x-api-key',
      authMethod: 'api-key',
      actor: 'bb-a...-key',
    };

    await runWithRequestAuthContext(context, async () => {
      await Promise.resolve();
      expect(getRequestAuthContext()).toEqual(context);
    });

    expect(getRequestAuthContext()).toBeUndefined();
  });
});
