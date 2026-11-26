import '@testing-library/jest-dom/vitest';
import {cleanup} from '@testing-library/react';
import React from 'react';
import {vi} from 'vite-plus/test';
import {resetAuthClientMock} from './test/mocks/authClient';
import {resetChartsMock} from './test/mocks/charts';
import {resetDateRangePickerMock} from './test/mocks/dateRangePicker';
import {resetNavigationMock} from './test/mocks/navigation';

const DEFAULT_URL = 'http://localhost:3000/';

/**
 * A few suites click real anchors, which can leave happy-dom on an opaque URL.
 * Reset the document URL so relative image and history operations stay valid.
 */
function resetLocation(): void {
  if (typeof window === 'undefined') return;
  const happyDOM = (window as unknown as {happyDOM?: {setURL?: (url: string) => void}}).happyDOM;
  if (happyDOM?.setURL) {
    happyDOM.setURL(DEFAULT_URL);
    return;
  }
  try {
    window.history.replaceState(null, '', DEFAULT_URL);
  } catch {
    // Nothing else can repair an opaque location in this environment.
  }
}

beforeEach(resetLocation);

afterEach(() => {
  cleanup();
  document.documentElement.lang = 'en-US';
  delete document.documentElement.dataset.currency;
  resetLocation();
  // Reset after each file's own hooks so test-specific configuration can never
  // be overwritten before a test runs.
  resetNavigationMock();
  resetAuthClientMock();
  resetChartsMock();
  resetDateRangePickerMock();
});

// The app-level doubles below are registered once per worker. Test files must
// configure the shared state instead of calling `vi.mock` for these modules,
// otherwise the first file in the shared module graph would win silently.

// Render next/image as a plain <img> in tests — strips NextImage-only props
// so they don't land on the DOM element and cause React warnings.
vi.mock('next/image', () => ({
  default: React.forwardRef(function NextImageMock(
    {
      src,
      alt,
      fill: _fill,
      width: _width,
      height: _height,
      unoptimized: _unoptimized,
      sizes: _sizes,
      preload: _preload,
      quality: _quality,
      onLoadingComplete: _onLoadingComplete,
      blurDataURL: _blurDataURL,
      placeholder: _placeholder,
      loader: _loader,
      ...rest
      // biome-ignore lint/suspicious/noExplicitAny: Required for tests
    }: any,
    // biome-ignore lint/suspicious/noExplicitAny: Required for tests
    ref: any,
  ) {
    return React.createElement('img', {src, alt, ref, ...rest});
  }),
}));

vi.mock('next/link', () => ({
  default: React.forwardRef(function NextLinkMock(
    {children, ...props}: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>,
    ref: React.ForwardedRef<HTMLAnchorElement>,
  ) {
    return React.createElement('a', {...props, ref}, children);
  }),
}));

vi.mock('next/navigation', async () => await import('./test/mocks/navigation'));
vi.mock('@/authClient', async () => await import('./test/mocks/authClient'));
vi.mock('@/components/Form/DateRangePicker', async () => await import('./test/mocks/dateRangePicker'));
vi.mock('@budgetbuddyde/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@budgetbuddyde/charts')>();
  const {ComposedChart} = await import('./test/mocks/charts');
  return {...actual, ComposedChart};
});
