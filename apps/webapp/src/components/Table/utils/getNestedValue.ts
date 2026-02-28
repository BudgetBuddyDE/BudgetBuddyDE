/**
 * Safely retrieves a nested value from an object based on a dot-separated path.
 * @param obj The object from which to retrieve the value.
 * @param path The dot-separated path string (e.g., "user.profile.name").
 * @returns The value at the specified path, or undefined if any part of the path is invalid.
 */
export function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
