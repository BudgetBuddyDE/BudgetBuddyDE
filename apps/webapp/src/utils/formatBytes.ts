/**
 * Formats a byte count as a human-readable string.
 *
 * @param bytes - Number of bytes. Pass `null` or `undefined` to return an empty string.
 * @returns Formatted string, e.g. `"1.5 MB"`.
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
