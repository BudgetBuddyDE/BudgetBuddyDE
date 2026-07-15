export function createApiKeyRequestConfig(apiKey: string): RequestInit {
  return {
    headers: {
      Accept: 'application/json',
      'x-api-key': apiKey,
    },
  };
}
