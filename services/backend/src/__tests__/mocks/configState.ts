import type {AppConfig} from '../../config';

let overrides: Record<PropertyKey, unknown> = {};

/**
 * Wraps the real, environment-derived configuration so a test can replace only
 * the properties it needs. The real values remain the default for every other
 * test in the shared module graph.
 */
export function createConfigMock(realConfig: AppConfig): {config: AppConfig} {
  const config = new Proxy(realConfig, {
    get(target, property, receiver) {
      if (Reflect.has(overrides, property)) return Reflect.get(overrides, property);
      return Reflect.get(target, property, receiver);
    },
  });
  return {config};
}

export function setConfigOverrides(next: Record<PropertyKey, unknown>): void {
  overrides = {...overrides, ...next};
}

export function resetConfigOverrides(): void {
  overrides = {};
}
