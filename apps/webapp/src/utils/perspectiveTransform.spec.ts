import {describe, expect, it} from 'vitest';
import type {Point} from './perspectiveTransform';
import {
  applyHomographyToPoint,
  applyPerspectiveTransform,
  computeHomography,
  estimateOutputDimensions,
  solveLinearSystem,
} from './perspectiveTransform';

// ─── solveLinearSystem ──────────────────────────────────────────────────────

describe('solveLinearSystem', () => {
  it('solves a simple 2×2 system', () => {
    // 2x + y = 5
    // x + 3y = 10
    const A = [
      [2, 1],
      [1, 3],
    ];
    const b = [5, 10];
    const [x, y] = solveLinearSystem(A, b);
    expect(x).toBeCloseTo(1, 5);
    expect(y).toBeCloseTo(3, 5);
  });

  it('solves a 3×3 identity system', () => {
    const A = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const b = [4, 5, 6];
    const result = solveLinearSystem(A, b);
    expect(result).toHaveLength(3);
    expect(result[0]).toBeCloseTo(4, 5);
    expect(result[1]).toBeCloseTo(5, 5);
    expect(result[2]).toBeCloseTo(6, 5);
  });
});

// ─── computeHomography + applyHomographyToPoint ─────────────────────────────

describe('computeHomography', () => {
  it('returns an identity-like mapping when src === dst', () => {
    const corners: Point[] = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ];
    const H = computeHomography(corners, corners);

    // Applying H to each source point should return the same point
    for (const p of corners) {
      const [xp, yp] = applyHomographyToPoint(H, p[0], p[1]);
      expect(xp).toBeCloseTo(p[0], 3);
      expect(yp).toBeCloseTo(p[1], 3);
    }
  });

  it('maps the top-left corner correctly after a perspective transform', () => {
    // Simulated perspective: skewed quadrilateral in source → rectangle in dst
    const src: Point[] = [
      [10, 5],
      [190, 0],
      [200, 200],
      [0, 200],
    ];
    const dst: Point[] = [
      [0, 0],
      [200, 0],
      [200, 200],
      [0, 200],
    ];
    const H = computeHomography(src, dst);

    // Each source corner should map to the corresponding destination corner
    for (let i = 0; i < 4; i++) {
      const [xp, yp] = applyHomographyToPoint(H, src[i][0], src[i][1]);
      expect(xp).toBeCloseTo(dst[i][0], 2);
      expect(yp).toBeCloseTo(dst[i][1], 2);
    }
  });
});

// ─── estimateOutputDimensions ───────────────────────────────────────────────

describe('estimateOutputDimensions', () => {
  it('returns exact dimensions for an axis-aligned rectangle', () => {
    const corners: [Point, Point, Point, Point] = [
      [0, 0],
      [300, 0],
      [300, 200],
      [0, 200],
    ];
    const {width, height} = estimateOutputDimensions(corners);
    expect(width).toBe(300);
    expect(height).toBe(200);
  });

  it('caps the longest side at 2 000 px', () => {
    const corners: [Point, Point, Point, Point] = [
      [0, 0],
      [4000, 0],
      [4000, 6000],
      [0, 6000],
    ];
    const {width, height} = estimateOutputDimensions(corners);
    expect(Math.max(width, height)).toBeLessThanOrEqual(2000);
  });

  it('keeps aspect ratio when scaling down', () => {
    const corners: [Point, Point, Point, Point] = [
      [0, 0],
      [4000, 0],
      [4000, 2000],
      [0, 2000],
    ];
    const {width, height} = estimateOutputDimensions(corners);
    expect(width / height).toBeCloseTo(2, 1);
  });
});

// ─── applyPerspectiveTransform ──────────────────────────────────────────────
// Note: applyPerspectiveTransform requires a real Canvas 2D context.
// happy-dom (the test environment) returns null for getContext('2d'),
// so these tests verify only the output canvas dimensions using a mock.

describe('applyPerspectiveTransform', () => {
  it('returns a canvas with the specified output dimensions', () => {
    // Minimal canvas mock that satisfies the function's getContext/getImageData/
    // createImageData/putImageData calls without needing a real GPU context.
    const makeCtxMock = (w: number, h: number) => ({
      getImageData: () => ({data: new Uint8ClampedArray(w * h * 4)}),
      createImageData: (ow: number, oh: number) => ({data: new Uint8ClampedArray(ow * oh * 4)}),
      putImageData: () => {},
    });

    const srcCanvas = {width: 200, height: 200, getContext: () => makeCtxMock(200, 200)};
    // Stub document.createElement so the output canvas also uses the mock
    const origCreate = document.createElement.bind(document);
    document.createElement = (tag: string) => {
      if (tag === 'canvas') {
        const c = {width: 0, height: 0, _ctxMock: null as ReturnType<typeof makeCtxMock> | null};
        // @ts-expect-error minimal mock
        c.getContext = () => {
          if (!c._ctxMock) c._ctxMock = makeCtxMock(c.width, c.height);
          return c._ctxMock;
        };
        return c as unknown as HTMLCanvasElement;
      }
      return origCreate(tag);
    };

    const corners: [Point, Point, Point, Point] = [
      [0, 0],
      [200, 0],
      [200, 200],
      [0, 200],
    ];
    const result = applyPerspectiveTransform(srcCanvas as unknown as HTMLCanvasElement, corners, 100, 80);
    expect(result.width).toBe(100);
    expect(result.height).toBe(80);

    document.createElement = origCreate;
  });
});
