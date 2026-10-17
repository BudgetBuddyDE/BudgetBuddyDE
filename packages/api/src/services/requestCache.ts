type CachedResponse = {
  body: string;
  headers: [string, string][];
  status: number;
  statusText: string;
  expiresAt: number;
};

const responseCache = new Map<string, CachedResponse>();
const inFlightRequests = new Map<string, Promise<Response>>();
const DEFAULT_TTL_MS = 30_000;
const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'proxy-authorization', 'x-api-key']);
let cacheScope: string | null = null;
let cacheGeneration = 0;

function isBrowser() {
  return typeof window !== 'undefined';
}

function cacheKey(input: RequestInfo | URL, init: RequestInit | undefined, method: string) {
  const headers = getRequestHeaders(input, init);
  const url = input instanceof Request ? input.url : String(input);
  const varyHeaders = [...headers.entries()]
    .filter(([name]) => !SENSITIVE_HEADERS.has(name))
    .sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify([cacheScope, method, url, varyHeaders]);
}

function getRequestHeaders(input: RequestInfo | URL, init: RequestInit | undefined) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  return headers;
}

function toResponse(cached: CachedResponse) {
  return new Response(cached.body, {
    status: cached.status,
    statusText: cached.statusText,
    headers: cached.headers,
  });
}

export async function fetchWithCache(
  input: RequestInfo | URL,
  init?: RequestInit,
  ttlMs = DEFAULT_TTL_MS,
): Promise<Response> {
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const requestHeaders = getRequestHeaders(input, init);
  const hasExplicitCredentials = [...SENSITIVE_HEADERS].some(header => requestHeaders.has(header));
  const cacheMode = init?.cache ?? (input instanceof Request ? input.cache : undefined);
  const hasRequestBody = init?.body != null || (input instanceof Request && input.body !== null);
  const canCache =
    isBrowser() &&
    method === 'GET' &&
    !hasRequestBody &&
    cacheMode !== 'no-store' &&
    cacheScope !== null &&
    !hasExplicitCredentials;

  if (!canCache) {
    if (method === 'GET') return fetch(input, init);
    clearRequestCache();
    try {
      return await fetch(input, init);
    } finally {
      clearRequestCache();
    }
  }

  const generation = cacheGeneration;
  const key = cacheKey(input, init, method);
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return toResponse(cached);
  responseCache.delete(key);

  let request = inFlightRequests.get(key);
  if (!request) {
    request = fetch(input, init);
    inFlightRequests.set(key, request);
  }

  try {
    const response = await request;
    if (
      generation === cacheGeneration &&
      response.ok &&
      response.headers.get('content-type')?.includes('application/json')
    ) {
      const body = await response.clone().text();
      if (generation === cacheGeneration) {
        responseCache.set(key, {
          body,
          headers: [...response.headers.entries()],
          status: response.status,
          statusText: response.statusText,
          expiresAt: Date.now() + ttlMs,
        });
      }
    }
    return response.clone();
  } finally {
    if (inFlightRequests.get(key) === request) inFlightRequests.delete(key);
  }
}

export function clearRequestCache() {
  cacheGeneration += 1;
  responseCache.clear();
  inFlightRequests.clear();
}

/** Sets the authenticated principal used to isolate browser-cached private responses. */
export function setRequestCacheScope(scope: string | null) {
  if (cacheScope === scope) return;
  cacheScope = scope;
  clearRequestCache();
}

export function resetRequestCacheForTests() {
  cacheScope = null;
  cacheGeneration = 0;
  responseCache.clear();
  inFlightRequests.clear();
}
