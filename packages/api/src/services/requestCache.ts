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

function isBrowser() {
  return typeof window !== 'undefined';
}

function cacheKey(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  return `${typeof input === 'string' ? input : input.toString()}|${headers.get('accept') ?? ''}`;
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
  const method = (init?.method ?? 'GET').toUpperCase();
  const canCache = isBrowser() && method === 'GET' && init?.cache !== 'no-store';

  if (!canCache) {
    const response = await fetch(input, init);
    if (method !== 'GET') responseCache.clear();
    return response;
  }

  const key = cacheKey(input, init);
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
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const body = await response.clone().text();
      responseCache.set(key, {
        body,
        headers: [...response.headers.entries()],
        status: response.status,
        statusText: response.statusText,
        expiresAt: Date.now() + ttlMs,
      });
    }
    return response.clone();
  } finally {
    if (inFlightRequests.get(key) === request) inFlightRequests.delete(key);
  }
}

export function clearRequestCache() {
  responseCache.clear();
}

export function resetRequestCacheForTests() {
  responseCache.clear();
  inFlightRequests.clear();
}
