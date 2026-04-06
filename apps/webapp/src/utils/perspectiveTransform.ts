/**
 * Pure-JavaScript 4-point perspective (homography) transform.
 *
 * The algorithm:
 *  1. Build an 8×8 linear system from the 4 source/destination point pairs.
 *  2. Solve via Gaussian elimination with partial pivoting.
 *  3. Use the resulting 3×3 homography matrix for inverse-mapping every
 *     destination pixel back to its source pixel (nearest-neighbour sampling).
 *
 * No external dependencies – runs entirely in the browser with Canvas.
 */

export type Point = [number, number]; // [x, y]

/**
 * Solves the linear system A·x = b using Gaussian elimination with partial
 * pivoting. Returns the solution vector x.
 */
export function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  // Augmented matrix [A | b]
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-12) {
      throw new Error('Singular matrix – corners may be collinear');
    }

    // Reduced-row echelon elimination
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col] / aug[col][col];
        for (let k = col; k <= n; k++) {
          aug[row][k] -= factor * aug[col][k];
        }
      }
    }
  }

  return aug.map((row, i) => row[n] / row[i]);
}

/**
 * Computes the 3×3 homography matrix (flat, row-major 9 elements) that maps
 * each of the 4 `src` points to the corresponding `dst` point.
 *
 * Ordering convention (used throughout this module):
 *   index 0 = top-left
 *   index 1 = top-right
 *   index 2 = bottom-right
 *   index 3 = bottom-left
 */
export function computeHomography(src: Point[], dst: Point[]): number[] {
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [xp, yp] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -xp * x, -xp * y]);
    b.push(xp);
    A.push([0, 0, 0, x, y, 1, -yp * x, -yp * y]);
    b.push(yp);
  }

  const h = solveLinearSystem(A, b);
  // h has 8 elements; append the implicit h8 = 1
  return [...h, 1];
}

/**
 * Applies a homography H (flat 9-element array) to a single point.
 * Returns the projected point [x', y'].
 */
export function applyHomographyToPoint(H: number[], x: number, y: number): Point {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
}

/**
 * Estimates sensible output dimensions from the 4 source corners by averaging
 * the lengths of opposite sides of the quadrilateral.
 */
export function estimateOutputDimensions(corners: [Point, Point, Point, Point]): {
  width: number;
  height: number;
} {
  const [tl, tr, br, bl] = corners;
  const topWidth = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const bottomWidth = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
  const leftHeight = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
  const rightHeight = Math.hypot(br[0] - tr[0], br[1] - tr[1]);

  const rawWidth = Math.round((topWidth + bottomWidth) / 2);
  const rawHeight = Math.round((leftHeight + rightHeight) / 2);

  // Cap longest side at 2 000 px to keep the pixel-loop fast in JS.
  const maxSide = 2000;
  const scale = Math.min(1, maxSide / Math.max(rawWidth, rawHeight, 1));

  return {
    width: Math.max(1, Math.round(rawWidth * scale)),
    height: Math.max(1, Math.round(rawHeight * scale)),
  };
}

/**
 * Applies a 4-point perspective correction to `srcCanvas` and returns a new
 * `HTMLCanvasElement` containing the straightened image.
 *
 * @param srcCanvas    - Source canvas holding the captured image.
 * @param corners      - [topLeft, topRight, bottomRight, bottomLeft] in source pixel coords.
 * @param outputWidth  - Desired output width in pixels.
 * @param outputHeight - Desired output height in pixels.
 */
export function applyPerspectiveTransform(
  srcCanvas: HTMLCanvasElement,
  corners: [Point, Point, Point, Point],
  outputWidth: number,
  outputHeight: number,
): HTMLCanvasElement {
  // Destination is always a clean rectangle.
  const dstCorners: [Point, Point, Point, Point] = [
    [0, 0],
    [outputWidth, 0],
    [outputWidth, outputHeight],
    [0, outputHeight],
  ];

  // Build the homography from *destination* → *source* for inverse mapping:
  // for each output (dx, dy) we look up the corresponding source (sx, sy).
  const H = computeHomography(dstCorners, corners);

  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('Cannot get 2D context from source canvas');

  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height).data;
  const srcW = srcCanvas.width;
  const srcH = srcCanvas.height;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outputWidth;
  outCanvas.height = outputHeight;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Cannot get 2D context from output canvas');

  const outImageData = outCtx.createImageData(outputWidth, outputHeight);
  const outData = outImageData.data;

  for (let dy = 0; dy < outputHeight; dy++) {
    for (let dx = 0; dx < outputWidth; dx++) {
      const [sx, sy] = applyHomographyToPoint(H, dx, dy);
      const roundSx = Math.round(sx);
      const roundSy = Math.round(sy);

      if (roundSx >= 0 && roundSx < srcW && roundSy >= 0 && roundSy < srcH) {
        const si = (roundSy * srcW + roundSx) * 4;
        const di = (dy * outputWidth + dx) * 4;
        outData[di] = srcData[si];
        outData[di + 1] = srcData[si + 1];
        outData[di + 2] = srcData[si + 2];
        outData[di + 3] = srcData[si + 3];
      }
    }
  }

  outCtx.putImageData(outImageData, 0, 0);
  return outCanvas;
}
