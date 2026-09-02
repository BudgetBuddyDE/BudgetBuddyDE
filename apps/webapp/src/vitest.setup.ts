import '@testing-library/jest-dom/vitest';
import React from 'react';
import {vi} from 'vitest';

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

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({push: vi.fn(), replace: vi.fn(), back: vi.fn()})),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
