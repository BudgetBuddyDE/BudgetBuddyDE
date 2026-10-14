/**
 * Mixes two hex colors. `ratio` 0 returns `from`, 1 returns `to`.
 */
export function mixHex(from: string, to: string, ratio: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  const a = parseHex(from);
  const b = parseHex(to);
  const r = Math.round(a.r + (b.r - a.r) * clamped);
  const g = Math.round(a.g + (b.g - a.g) * clamped);
  const bl = Math.round(a.b + (b.b - a.b) * clamped);
  return `rgb(${r}, ${g}, ${bl})`;
}

function parseHex(hex: string): {r: number; g: number; b: number} {
  let value = hex.replace('#', '').trim();
  if (value.length === 3) {
    value = value
      .split('')
      .map(char => char + char)
      .join('');
  }
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}
