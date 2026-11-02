/** Matches only the configured backend origin and its request paths. */
export function createBackendTraceUrlPattern(backendUrl: string): RegExp {
  const origin = new URL(backendUrl).origin;
  const escapedOrigin = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escapedOrigin}(?:/|$)`, 'i');
}
