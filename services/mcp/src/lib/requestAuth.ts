import {AsyncLocalStorage} from 'node:async_hooks';
import type {Request} from 'express';

type AuthHeaderName = 'authorization' | 'x-api-key';
type AuthMethod = 'bearer-token' | 'api-key';

export type RequestAuthContext = {
  token: string;
  headerName: AuthHeaderName;
  authMethod: AuthMethod;
  actor: string;
};

const requestAuthStorage = new AsyncLocalStorage<RequestAuthContext>();

export function runWithRequestAuthContext<T>(context: RequestAuthContext, callback: () => Promise<T>): Promise<T> {
  return requestAuthStorage.run(context, callback);
}

export function getRequestAuthContext(): RequestAuthContext | undefined {
  return requestAuthStorage.getStore();
}

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }
  return value?.trim() || null;
}

function getActorFingerprint(token: string): string {
  if (token.length <= 8) return token;
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function getBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(/\s+/, 2);
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token.trim() || null;
}

export function extractRequestAuth(req: Pick<Request, 'headers'>): RequestAuthContext | null {
  const apiKey = getHeaderValue(req.headers['x-api-key']);
  if (apiKey) {
    return {
      token: apiKey,
      headerName: 'x-api-key',
      authMethod: 'api-key',
      actor: getActorFingerprint(apiKey),
    };
  }

  const bearerToken = getBearerToken(getHeaderValue(req.headers.authorization));
  if (!bearerToken) return null;

  return {
    token: bearerToken,
    headerName: 'authorization',
    authMethod: 'bearer-token',
    actor: getActorFingerprint(bearerToken),
  };
}
