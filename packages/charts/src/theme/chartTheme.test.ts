import {describe, expect, it} from 'vitest';
import {categoricalColors, colorIndex, darkCategoricalColors} from './chartTheme';

describe('category colors', () => {
  it('keeps category identity stable after sorting or filtering', () => {
    const colors = (keys: string[]) => Object.fromEntries(keys.map(key => [key, colorIndex(key)]));
    expect(colors(['Rent', 'Food']).Rent).toBe(colors(['Food', 'Rent']).Rent);
    expect(colors(['Rent']).Rent).toBe(colors(['Food', 'Rent']).Rent);
  });
  it('has unique paired colors in both schemes', () => {
    expect(new Set(categoricalColors).size).toBe(categoricalColors.length);
    expect(new Set(darkCategoricalColors).size).toBe(darkCategoricalColors.length);
    expect(darkCategoricalColors).toHaveLength(categoricalColors.length);
  });
  it('keeps categorical marks above 3:1 on representative light and dark surfaces', () => {
    const luminance = (hex: string) => {
      const channels = hex
        .slice(1)
        .match(/../g)!
        .map(value => {
          const channel = Number.parseInt(value, 16) / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    for (const [palette, surface] of [
      [categoricalColors, '#FFFFFF'],
      [darkCategoricalColors, '#19354E'],
    ] as const) {
      for (const color of palette) {
        const a = luminance(color);
        const b = luminance(surface);
        expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
