/**
 * Checks if a value is a Promise.
 * @param value The value to check if it is a Promise.
 * @returns True if the value is a Promise, false otherwise.
 */
export function isPromise(value: any): value is Promise<unknown> {
  return value instanceof Promise;
}
